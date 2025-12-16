// sockets/chatSocket.js
const jwt = require("jsonwebtoken");
const { getUserGroups } = require("../services/groupService");
const { saveMessage } = require("../services/messageService");
const queryMySQL = require("../utils/queryMySQL");

module.exports = function initChatSocket(io) {
  // Sử dụng namespace "/chat"
  const chatIo = io.of("/chat");
  const userSocketMap = {}; // { [userId]: socket.id }

  // Middleware xác thực JWT khi client kết nối vào namespace /chat
  chatIo.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(
        token.split(" ")[1],
        process.env.SECRET || "change_this_secret"
      );
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  chatIo.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(
      `Chat client connected: userId=${userId}, socketId=${socket.id}`
    );

    // Lưu map userId → socket.id
    userSocketMap[userId] = socket.id;

    // Join tất cả group mà user này tham gia
    try {
      const userGroups = await getUserGroups(userId);
      userGroups.forEach((groupId) => {
        socket.join(String(groupId));
      });
    } catch (err) {
      console.error("Error fetching user groups:", err);
    }

    // Xử lý sự kiện "sendMessage" từ client
    socket.on("sendMessage", async (rawData) => {
      let msg;
      try {
        msg = JSON.parse(rawData);
      } catch {
        console.warn("Invalid JSON in sendMessage");
        return;
      }
      const { sender_id, receiver_id, group_id, content, image_url } = msg;
      try {
        // Lưu tin nhắn vào DB
        await saveMessage({
          sender_id,
          receiver_id,
          group_id,
          content,
          image_url,
        });

        if (group_id) {
          // Emit cho toàn nhóm
          chatIo.to(String(group_id)).emit("newGroupMessage", msg);
        } else {
          // Tin nhắn riêng lẻ → emit chỉ cho socket của receiver
          const receiverSocketId = userSocketMap[receiver_id];
          if (receiverSocketId) {
            chatIo.to(receiverSocketId).emit("newMessage", msg);
          }
        }
      } catch (error) {
        console.error("Error saving/sending message:", error);
      }
    });

    // Xử lý sự kiện "shareChart" từ client
    socket.on("shareChart", async (rawData) => {
      let msg;
      try {
        msg = JSON.parse(rawData);
      } catch {
        console.warn("Invalid JSON in shareChart");
        return;
      }
      const { sender_id, receiver_id, group_id } = msg;
      try {
        // Lấy thông tin người gửi chart
        const [senderInfo] = await queryMySQL(
          "SELECT userID, name, image AS avatar FROM users WHERE userID = ?",
          [sender_id]
        );

        if (group_id) {
          // Emit cho cả group
          chatIo
            .to(String(group_id))
            .emit("newGroupChart", { ...msg, senderInfo });
        } else {
          // Emit cho riêng user
          const receiverSocketId = userSocketMap[receiver_id];
          if (receiverSocketId) {
            chatIo
              .to(receiverSocketId)
              .emit("newChart", { ...msg, senderInfo });
          }
        }
      } catch (error) {
        console.error("Error in shareChart:", error);
      }
    });

    // Cho phép client join thêm group sau khi kết nối
    socket.on("joinGroup", ({ groupId }) => {
      socket.join(String(groupId));
    });

    socket.on("disconnect", () => {
      console.log(
        `Chat client disconnected: userId=${userId}, socketId=${socket.id}`
      );
      delete userSocketMap[userId];
    });
  });
};

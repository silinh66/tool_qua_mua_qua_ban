// sockets/homeSocket.js
const fs = require("fs");
const queryMySQL = require("../utils/queryMySQL");

const { getIboardData } = require("../services/iboardService");

let iboardData = null; // Biến lưu trữ dữ liệu iboard dưới dạng chuỗi

// Hàm cập nhật dữ liệu iboard từ file một cách liên tục
const updateIboardData = async () => {
  try {
    iboardData = await fs.readFileSync("iboard.json", "utf8");
  } catch (err) {
    console.error("Error reading iboard.json:", err);
    iboardData = null;
  }
};

// Gọi hàm updateIboardData mỗi giây
setInterval(updateIboardData, 1000);

// Hàm lấy danh sách groupId mà một userId là thành viên
async function getUserGroups(userId) {
  const queryString = "SELECT group_id FROM group_members WHERE user_id = ?";
  const results = await queryMySQL(queryString, [userId]);
  return results.map((result) => result.group_id);
}

module.exports = function initHomeSocket(io) {
  // Sử dụng namespace "/home"
  const homeIo = io.of("/home");
  const userSocketMap = {}; // { [userId]: socket.id }

  homeIo.on("connection", (socket) => {
    console.log(`HOME client connected: socketId=${socket.id}`);

    // Nếu client gửi một sự kiện "identify", gán socket.id vào userSocketMap
    socket.on("identify", async (token) => {
      try {
        // Giả sử token đã được giải mã trong middleware Chat,
        // hoặc bạn tự decode JWT ở đây để lấy userId
        const decoded = require("jsonwebtoken").verify(
          token.split(" ")[1],
          process.env.SECRET || "change_this_secret"
        );
        const userId = decoded.userId;
        userSocketMap[userId] = socket.id;

        // Cho phép user join các group mà họ là thành viên
        const groups = await getUserGroups(userId);
        groups.forEach((groupId) => {
          socket.join(String(groupId));
        });
      } catch (err) {
        console.error("Identify error:", err);
      }
    });

    // Hàm gửi dữ liệu cập nhật mỗi giây
    const sendUpdates = async () => {
      try {
        const [top20DatHOSE] = await queryMySQL(`SELECT * FROM top20_hose`);
        const [top20DataHNX] = await queryMySQL(`SELECT * FROM top20_hnx`);
        const [changeCountDataHOSE] = await queryMySQL(
          "SELECT * FROM change_count WHERE `index` = 'VNINDEX'"
        );
        const [changeCountDataHNX] = await queryMySQL(
          "SELECT * FROM change_count WHERE `index` = 'HNX'"
        );
        const [nuocNgoaiData] = await queryMySQL("SELECT * FROM nuoc_ngoai");
        const [nuocNgoaiAllData] = await queryMySQL(
          "SELECT * FROM nuoc_ngoai_all"
        );

        // Nếu giờ < 9h, reset dữ liệu về mặc định
        const now = new Date();
        const hours = now.getHours();
        if (hours < 9) {
          top20DatHOSE.length = 0;
          top20DataHNX.length = 0;
        }

        socket.emit("data", {
          top20: {
            hose: top20DatHOSE,
            hnx: top20DataHNX,
          },
          changeCount: {
            hose: changeCountDataHOSE,
            hnx: changeCountDataHNX,
          },
          nuocNgoai: nuocNgoaiData,
          nuocNgoaiAll: nuocNgoaiAllData,
          iboard: iboardData,
        });
      } catch (err) {
        console.error("Error sending Home update:", err);
      }
    };

    // Lặp gửi mỗi giây
    const intervalId = setInterval(sendUpdates, 1000);

    socket.on("disconnect", () => {
      clearInterval(intervalId);
      console.log(`HOME client disconnected: socketId=${socket.id}`);
      // Nếu socket.id được gán cho một userId, xóa khỏi userSocketMap
      for (const userId in userSocketMap) {
        if (userSocketMap[userId] === socket.id) {
          delete userSocketMap[userId];
          break;
        }
      }
    });
  });
};

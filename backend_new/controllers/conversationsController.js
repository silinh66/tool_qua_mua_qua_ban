// controllers/conversationsController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 87. GET /conversations
 *    - Trả về object gồm 2 mảng: groups và direct.
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetching group conversations with the latest message or groups without messages
    let groupConversations = await queryMySQL(
      `SELECT g.id, g.name, g.image_url, 
      (SELECT MAX(m.created_at) FROM messages m WHERE m.group_id = g.id) as last_message_time,
      (SELECT m.content FROM messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
      (SELECT m.is_viewed FROM messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as is_viewed
    FROM \`groups\` g 
    JOIN group_members gm ON g.id = gm.group_id 
    WHERE gm.user_id = ?
    GROUP BY g.id 
    ORDER BY last_message_time DESC, g.id DESC`,
      [userId]
    );

    // Fetching details of group members
    for (let group of groupConversations) {
      const members = await queryMySQL(
        `SELECT u.userID, u.name, u.image as avatar 
      FROM users u 
      JOIN group_members gm ON u.userID = gm.user_id 
      WHERE gm.group_id = ?`,
        [group.id]
      );
      group.members = members;
    }

    let directConversations = await queryMySQL(
      `SELECT u.userID, u.name, u.image as avatar, MAX(m.created_at) as last_message_time,
    (SELECT m.content FROM messages m WHERE (m.sender_id = u.userID OR m.receiver_id = u.userID) AND m.group_id IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT m.is_viewed FROM messages m WHERE (m.sender_id = u.userID OR m.receiver_id = u.userID) AND m.group_id IS NULL ORDER BY m.created_at DESC LIMIT 1) as is_viewed
    FROM users u 
    JOIN messages m ON (m.sender_id = u.userID OR m.receiver_id = u.userID) 
    WHERE (m.sender_id = ? OR m.receiver_id = ?) AND m.group_id IS NULL 
    GROUP BY u.userID 
    ORDER BY last_message_time DESC`,
      [userId, userId]
    );

    res.json({
      success: true,
      conversations: {
        groups: groupConversations,
        direct: directConversations,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 88. POST /startDirectChat
 *    - Body: { receiver_id }
 *    - Nếu đã có message giữa hai user thì trả về conversation kèm messages,
 *      ngược lại trả về conversation trống.
 */
exports.startDirectChat = async (req, res, next) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.userId; // Giả sử middleware authenticateToken đã gán req.user

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    // Ví dụ: Lấy thông tin người nhận từ cơ sở dữ liệu
    const userQuery = await queryMySQL(
      "SELECT userID AS userID, name, image AS avatar FROM users WHERE userID = ?",
      [receiver_id]
    );

    if (!userQuery || userQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }
    const receiver = userQuery[0];

    // Kiểm tra xem đã có cuộc trò chuyện nào chưa (ví dụ: lấy tin nhắn cuối cùng)
    const existingChat = await queryMySQL(
      `SELECT * FROM messages 
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
         AND group_id IS NULL 
       ORDER BY created_at DESC
       LIMIT 1`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    let conversationData;
    if (existingChat && existingChat.length > 0) {
      conversationData = {
        conversation_id: `${sender_id}_${receiver_id}`,
        userID: receiver.userID,
        name: receiver.name,
        avatar: receiver.avatar,
        last_message_time: existingChat[0].created_at,
        last_message_content: existingChat[0].content,
        is_viewed: existingChat[0].is_viewed,
      };

      return res.json({
        success: true,
        message: "Conversation already exists",
        conversation: conversationData,
      });
    } else {
      conversationData = {
        conversation_id: `${sender_id}_${receiver_id}`,
        userID: receiver.userID,
        name: receiver.name,
        avatar: receiver.avatar,
        last_message_time: null,
        last_message_content: "",
        is_viewed: 1,
      };

      return res.json({
        success: true,
        message: "Conversation started but no messages yet",
        conversation: conversationData,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 89. POST /messages/:message_id/view
 *    - Đánh dấu tin nhắn đã xem (set is_viewed = true trong message_views).
 */
exports.markMessageViewed = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.message_id;

    await queryMySQL("UPDATE messages SET is_viewed = true WHERE id = ?", [
      messageId,
    ]);

    res.json({ success: true, message: "Message view updated" });
  } catch (err) {
    next(err);
  }
};

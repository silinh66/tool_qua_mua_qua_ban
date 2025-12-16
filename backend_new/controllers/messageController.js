// controllers/messageController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 83. GET /getMessages
 *     - queryMySQL param: receiver_id (direct chat) hoặc group_id (group chat).
 *     - JWT required.
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { receiver_id, group_id } = req.query;
    let messages;
    if (group_id) {
      messages = await queryMySQL("SELECT * FROM messages WHERE group_id = ?", [
        group_id,
      ]);
    } else {
      messages = await queryMySQL(
        "SELECT * FROM messages WHERE receiver_id = ?",
        [receiver_id]
      );
    }
    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

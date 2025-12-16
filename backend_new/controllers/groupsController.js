// controllers/groupsController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 84. POST /createGroup
 *    - Body: { name }
 *    - Tạo group rồi thêm creator vào group_members.
 */
exports.createGroup = async (req, res, next) => {
  try {
    const { name } = req.body;
    const creatorUserId = req.user.userId;

    // Tạo nhóm
    const groupResult = await queryMySQL(
      "INSERT INTO `groups` (name) VALUES (?)",
      [name]
    );
    const groupId = groupResult.insertId;

    // Thêm người tạo vào nhóm
    await queryMySQL(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
      [groupId, creatorUserId]
    );
    groups.js;
    res.json({
      success: true,
      message: "Group created and creator added as member",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 85. POST /addGroupMembers
 *    - Body: { group_id, user_ids: [<userId>, ...] }
 */
exports.addGroupMembers = async (req, res, next) => {
  try {
    const { group_id, user_ids } = req.body;
    // Kiểm tra danh sách người dùng
    if (!user_ids || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No user IDs provided",
      });
    }

    // Thêm mỗi người dùng vào nhóm
    for (const user_id of user_ids) {
      await queryMySQL(
        "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)",
        [group_id, user_id]
      );
    }

    res.json({ success: true, message: "Members added to group" });
  } catch (err) {
    next(err);
  }
};

/**
 * 86. POST /removeGroupMember
 *    - Body: { group_id, user_id }
 */
exports.removeGroupMember = async (req, res, next) => {
  try {
    const { group_id, user_id } = req.body;

    await queryMySQL(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
      [group_id, user_id]
    );

    res.json({ success: true, message: "Member removed from group" });
  } catch (err) {
    next(err);
  }
};

// routes/groups.js
const express = require("express");
const router = express.Router();
const groupsController = require("../controllers/groupsController");
const authenticateToken = require("../middlewares/auth");

/**
 * 84. POST /createGroup
 *     - Tạo nhóm chat mới. Body: { name }. JWT required.
 */
router.post("/createGroup", authenticateToken, groupsController.createGroup);

/**
 * 85. POST /addGroupMembers
 *     - Thêm user vào group. Body: { group_id, user_ids: [<userId>] }. JWT required.
 */
router.post(
  "/addGroupMembers",
  authenticateToken,
  groupsController.addGroupMembers
);

/**
 * 86. POST /removeGroupMember
 *     - Xóa user khỏi group. Body: { group_id, user_id }. JWT required.
 */
router.post(
  "/removeGroupMember",
  authenticateToken,
  groupsController.removeGroupMember
);

module.exports = router;

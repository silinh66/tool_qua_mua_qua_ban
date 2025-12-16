// routes/conversations.js
const express = require("express");
const router = express.Router();
const conversationsController = require("../controllers/conversationsController");
const authenticateToken = require("../middlewares/auth");

/**
 * 87. GET /conversations
 *     - Lấy danh sách conversations (groups và direct). JWT required.
 */
router.get(
  "/conversations",
  authenticateToken,
  conversationsController.getConversations
);

/**
 * 88. POST /startDirectChat
 *     - Body: { receiver_id }. JWT required.
 */
router.post(
  "/startDirectChat",
  authenticateToken,
  conversationsController.startDirectChat
);

/**
 * 89. POST /messages/:message_id/view
 *     - Đánh dấu tin nhắn đã xem (JWT required).
 */
router.post(
  "/messages/:message_id/view",
  authenticateToken,
  conversationsController.markMessageViewed
);

module.exports = router;

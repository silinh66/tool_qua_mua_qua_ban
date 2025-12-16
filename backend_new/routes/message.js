// routes/message.js
const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authenticateToken = require("../middlewares/auth");

/**
 * 83. GET /getMessages
 *     - Query: receiver_id hoặc group_id  (JWT required).
 */
router.get("/getMessages", authenticateToken, messageController.getMessages);

module.exports = router;

// routes/accountAndConfig.js
const express = require("express");
const router = express.Router();
const accountAndConfigController = require("../controllers/accountAndConfigController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. GET /messages/:conversationId
 *    - Lấy lịch sử tin nhắn
 *    - Query param: type = "group" hoặc "user"
 *    - JWT required
 */
router.get(
  "/messages/:conversationId",
  authenticateToken,
  accountAndConfigController.getConversationMessages
);

/**
 * 2. POST /createAccount
 *    - Tạo tài khoản mô phỏng (mock trading account)
 *    - Body: { accountName }
 *    - JWT required
 */
router.post(
  "/createAccount",
  authenticateToken,
  accountAndConfigController.createAccount
);

/**
 * 3. GET /getAccountInfo
 *    - Lấy thông tin tài khoản mô phỏng
 *    - JWT required
 */
router.get(
  "/getAccountInfo",
  authenticateToken,
  accountAndConfigController.getAccountInfo
);

/**
 * 4. POST /placeOrder
 *    - Đặt lệnh mua/bán chứng khoán (mock)
 *    - Body: { stockSymbol, transactionType, quantity, price }
 *    - JWT required
 */
router.post(
  "/placeOrder",
  authenticateToken,
  accountAndConfigController.placeOrder
);

/**
 * 5. GET /getPortfolio
 *    - Lấy portfolio (danh mục) của user (mock)
 *    - JWT required
 */
router.get(
  "/getPortfolio",
  authenticateToken,
  accountAndConfigController.getPortfolio
);

/**
 * 6. POST /user-config-insert
 *    - Thêm mới hoặc cập nhật cấu hình người dùng
 *    - Body: { listTieuChi: [ { field, operator, value, … } ] }
 *    - JWT required
 */
router.post(
  "/user-config-insert",
  authenticateToken,
  accountAndConfigController.insertUserConfig
);

/**
 * 7. GET /user-config-get
 *    - Lấy toàn bộ config (bộ lọc kỹ thuật) của user hiện tại
 *    - JWT required
 */
router.get(
  "/user-config-get",
  authenticateToken,
  accountAndConfigController.getUserConfig
);

/**
 * 8. POST /user-config-share
 *    - Chia sẻ bộ lọc kỹ thuật (tương tự share Signal)
 *    - Body: { configID, receiverIDs: [<userId>] }
 *    - JWT required
 */
router.post(
  "/user-config-share",
  authenticateToken,
  accountAndConfigController.shareUserConfig
);

/**
 * 9. GET /user-config-share-requests
 *    - Lấy danh sách yêu cầu chia sẻ config mà user hiện đang nhận
 *    - JWT required
 */
router.get(
  "/user-config-share-requests",
  authenticateToken,
  accountAndConfigController.listUserConfigShareRequests
);

/**
 * 10. POST /user-config-share-response
 *     - Phản hồi yêu cầu chia sẻ config
 *     - Body: { sharedID, status }  // status = "ACCEPTED" hoặc "REJECTED"
 *     - JWT required
 */
router.post(
  "/user-config-share-response",
  authenticateToken,
  accountAndConfigController.respondUserConfigShare
);

module.exports = router;

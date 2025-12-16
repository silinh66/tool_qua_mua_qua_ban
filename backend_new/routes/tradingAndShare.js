// routes/tradingAndShare.js
const express = require("express");
const router = express.Router();
const tradingAndShareController = require("../controllers/tradingAndShareController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. GET /user-config-shared
 *    - Lấy danh sách config (bộ lọc kỹ thuật) đã share với user hiện tại
 *    - JWT required
 */
router.get(
  "/user-config-shared",
  authenticateToken,
  tradingAndShareController.getUserConfigShared
);

/**
 * 2. POST /matchOrder
 *    - Khớp lệnh cho mock trading
 *    - Body: { orderId, matchedPrice }
 *    - JWT required
 */
router.post(
  "/matchOrder",
  authenticateToken,
  tradingAndShareController.matchOrder
);

/**
 * 3. GET /getOrders
 *    - Lấy danh sách tất cả giao dịch (Transactions) của user hiện tại
 *    - JWT required
 */
router.get(
  "/getOrders",
  authenticateToken,
  tradingAndShareController.getOrders
);

/**
 * 4. DELETE /quan_tri_von
 *    - Xóa một symbol khỏi watchlist (quan_tri_von)
 *    - Body: { symbol }
 */
router.delete("/quan_tri_von", tradingAndShareController.deleteQuanTriVon);

/**
 * 5. GET /signals
 *    - Lấy danh sách tín hiệu (signals) của user hiện tại cùng các tín hiệu shared đã ACCEPTED
 *    - JWT required
 */
router.get("/signals", authenticateToken, tradingAndShareController.getSignals);

/**
 * 6. DELETE /signals/delete/:SignalID
 *    - Xóa một signal (cả shared và owned)
 *    - JWT required
 */
router.delete(
  "/signals/delete/:SignalID",
  authenticateToken,
  tradingAndShareController.deleteSignal
);

/**
 * 7. POST /signals/share
 *    - Chia sẻ signal tới nhiều user
 *    - Body: { SignalID, receiverIDs: [<userId>] }
 *    - JWT required
 */
router.post(
  "/signals/share",
  authenticateToken,
  tradingAndShareController.shareSignal
);

/**
 * 8. GET /signals/list-share-request
 *    - Lấy danh sách yêu cầu chia sẻ signal (status = "PENDING") cho user hiện tại
 *    - JWT required
 */
router.get(
  "/signals/list-share-request",
  authenticateToken,
  tradingAndShareController.listShareSignalRequests
);

/**
 * 9. POST /signals/respond
 *    - Xác nhận hoặc từ chối tín hiệu được chia sẻ
 *    - Body: { SharedID, Status } (Status = 'ACCEPTED' | 'REJECTED')
 *    - JWT required
 */
router.post(
  "/signals/respond",
  authenticateToken,
  tradingAndShareController.respondSignalShare
);

/**
 * 10. GET /signals/shared
 *     - Lấy danh sách user đã chia sẻ cho một SignalID
 *     - Query: SignalID
 *     - JWT required
 */
router.get(
  "/signals/shared",
  authenticateToken,
  tradingAndShareController.getSharedSignalDetails
);

/**
 * 11. POST /signals/add
 *     - Thêm mới một signal
 *     - Body: { signalInfo, symbol, signalName }
 *     - JWT required  (ownerId lấy từ token luôn)
 */
router.post(
  "/signals/add",
  authenticateToken,
  tradingAndShareController.addSignal
);

/**
 * 12. GET /listChiTieu
 *     - Lấy danh sách listChiTieu (của owner và những list đã được share ACCEPTED)
 *     - JWT required
 */
router.get(
  "/listChiTieu",
  authenticateToken,
  tradingAndShareController.getChiTieuLists
);

/**
 * 9. DELETE /listChiTieu/delete/:SignalID
 *    - Xóa một custom indicator list (listChiTieu)
 *    - JWT required
 */
router.delete(
  "/listChiTieu/delete/:SignalID",
  authenticateToken,
  tradingAndShareController.deleteChiTieu
);

/**
 * 10. POST /listChiTieu/share
 *     - Chia sẻ custom indicator list (listChiTieu) tới nhiều user
 *     - Body: { SignalID, receiverIDs: [<userId>] }
 *     - JWT required
 */
router.post(
  "/listChiTieu/share",
  authenticateToken,
  tradingAndShareController.shareChiTieu
);
router.get(
  "/listChiTieu/list-share-request",
  authenticateToken,
  tradingAndShareController.listShareRequest
);
router.post(
  "/listChiTieu/respond",
  authenticateToken,
  tradingAndShareController.shareChiTieu
);
router.get(
  "/listChiTieu/shared",
  authenticateToken,
  tradingAndShareController.shareChiTieu
);
router.post(
  "/listChiTieu/add",
  authenticateToken,
  tradingAndShareController.shareChiTieu
);

module.exports = router;

// routes/settingsAndIboard.js
const express = require("express");
const router = express.Router();
const settingsAndIboardController = require("../controllers/settingsAndIboardController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. GET /user/settings
 *    - Lấy tất cả cài đặt (bo_loc_ky_thuat) của user hiện tại
 *    - JWT required
 */
router.get(
  "/user/settings",
  authenticateToken,
  settingsAndIboardController.getUserSettings
);

/**
 * 2. POST /settings/updateConditions
 *    - Cập nhật (insert hoặc upsert) danh sách điều kiện kỹ thuật
 *    - Body: { listTieuChi: [ { settingID, name, value }, ... ] }
 *    - JWT required
 */
router.post(
  "/settings/updateConditions",
  authenticateToken,
  settingsAndIboardController.updateTechnicalConditions
);

/**
 * 3. POST /input_quan_tri_von
 *    - Thêm mới record cho bảng input_quan_tri_von
 *    - Body: { data: { ...fields } }
 */
router.post(
  "/input_quan_tri_von",
  settingsAndIboardController.insertInputQuanTriVon
);

/**
 * 4. GET /input_quan_tri_von
 *    - Lấy bản ghi mới nhất của input_quan_tri_von
 */
router.get(
  "/input_quan_tri_von",
  settingsAndIboardController.getInputQuanTriVon
);

/**
 * 5. GET /iboards
 *    - Lấy tất cả iBoards của user hiện tại
 *    - JWT required
 */
router.get(
  "/iboards",
  authenticateToken,
  settingsAndIboardController.getIboards
);

/**
 * 6. POST /iboard
 *    - Tạo mới một iBoard
 *    - Body: { title }
 *    - JWT required
 */
router.post(
  "/iboard",
  authenticateToken,
  settingsAndIboardController.createIboard
);

/**
 * 7. PUT /iboard/:id
 *    - Cập nhật tiêu đề một iBoard
 *    - Params: id = iboardID
 *    - Body: { title }
 *    - JWT required
 */
router.put(
  "/iboard/:id",
  authenticateToken,
  settingsAndIboardController.updateIboard
);

/**
 * 8. DELETE /iboard/:id
 *    - Xóa một iBoard
 *    - Params: id = iboardID
 *    - JWT required
 */
router.delete(
  "/iboard/:id",
  authenticateToken,
  settingsAndIboardController.deleteIboard
);

/**
 * 9. GET /iboard_details/:iboardID
 *    - Lấy danh sách symbols trong một iBoard
 *    - Params: iboardID
 *    - JWT required
 */
router.get(
  "/iboard_details/:iboardID",
  authenticateToken,
  settingsAndIboardController.getIboardDetails
);

/**
 * 10. POST /iboard_detail
 *     - Thêm mới symbol vào iBoard
 *     - Body: { iboardID, list_symbol }
 *     - JWT required
 */
router.post(
  "/iboard_detail",
  authenticateToken,
  settingsAndIboardController.addIboardDetail
);

router.get('/user/favorites', authenticateToken, settingsAndIboardController.getUserFavorites);
router.post('/user/favorites', authenticateToken, settingsAndIboardController.addOrUpdateFavorite);
router.delete('/user/favorites/:symbol', authenticateToken, settingsAndIboardController.removeFavorite);
router.put('/user/favorites/batch', authenticateToken, settingsAndIboardController.batchUpsertFavorites);

module.exports = router;

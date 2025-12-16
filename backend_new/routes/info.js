// routes/info.js
const express = require("express");
const router = express.Router();
const infoController = require("../controllers/infoController");
const authenticateToken = require("../middlewares/auth");

/**
 * 24. GET /stock-overview
 *     - Lấy tất cả dữ liệu từ bảng stock_overview.
 */
router.get("/stock-overview", infoController.getStockOverview);

/**
 * 25. GET /stock-overview/:id
 *     - Lấy stock-overview theo mã (c).
 */
router.get("/stock-overview/:id", infoController.getStockOverviewById);

/**
 * 26. GET /info-company
 *     - Lấy tất cả thông tin công ty từ bảng info_company.
 */
router.get("/info-company", infoController.getInfoCompany);

/**
 * 27. GET /info-company-follow
 *     - Lấy thông tin công ty kèm trạng thái đã follow hay chưa của user. JWT required.
 */
router.get(
  "/info-company-follow",
  authenticateToken,
  infoController.getInfoCompanyFollow
);

/**
 * 28. GET /users/getConfig
 *     - Lấy config cá nhân của user hiện tại (từ bảng user_configs). JWT required.
 */
router.get("/users/getConfig", authenticateToken, infoController.getUserConfig);

/**
 * 29. GET /top20/:type
 *     - Lấy danh sách top20 từ bảng top20_{type}. Ví dụ type = 'VNINDEX' hoặc 'HNX'.
 */
router.get("/top20/:type", infoController.getTop20);

/**
 * 30. GET /change_count/:type
 *     - Lấy dữ liệu change_count_{type}. Ví dụ type = 'VNINDEX' hoặc 'HNX'.
 */
router.get("/change_count/:type", infoController.getChangeCount);

/**
 * 31. GET /nuoc_ngoai
 *     - Lấy dữ liệu từ bảng nuoc_ngoai.
 */
router.get("/nuoc_ngoai", infoController.getNuocNgoai);

/**
 * 32. GET /nuoc_ngoai_all
 *     - Lấy dữ liệu từ bảng nuoc_ngoai_all.
 */
router.get("/nuoc_ngoai_all", infoController.getNuocNgoaiAll);

/**
 * 33. GET /tu_doanh
 *     - Lấy dữ liệu từ bảng tu_doanh.
 */
router.get("/tu_doanh", infoController.getTuDoanh);

// 35. GET /tu_doanh_all
router.get("/tu_doanh_all", infoController.getTuDoanhAll);

// 36. GET /statistics
router.get("/statistics", infoController.getStatistics);

// 37. GET /thanh_khoan_history/:type
router.get("/thanh_khoan_history/:type", infoController.getThanhKhoanHistory);

// 38. GET /thanh_khoan/:type
router.get("/thanh_khoan/:type", infoController.getThanhKhoan);

// 41. POST /register
router.post("/register", infoController.registerUser);

// 42. POST /register-token
router.post("/register-token", infoController.registerDeviceToken);

// 43. POST /send-notification
router.post("/send-notification", infoController.sendNotification);

router.get("/DailyStockPrice", infoController.getDailyStockPrice);

module.exports = router;

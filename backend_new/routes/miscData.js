// routes/miscData.js
const express = require("express");
const router = express.Router();
const miscDataController = require("../controllers/miscDataController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. GET /gia_xang_dau
 *    - Lấy dữ liệu từ bảng gia_xang_dau
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_xang_dau", miscDataController.getGiaXangDau);

/**
 * 2. GET /ty_gia_ngoai_te
 *    - Lấy dữ liệu từ bảng ty_gia_ngoai_te
 *    - (Không yêu cầu JWT)
 */
router.get("/ty_gia_ngoai_te", miscDataController.getTyGiaNgoaiTe);

/**
 * 3. GET /thanh_khoan_data/current/:type
 *    - Lấy dữ liệu thanh_khoan_data với date_type = 'current' và type tương ứng
 *    - Params: type = "hose" | "hnx"
 *    - (Không yêu cầu JWT)
 */
router.get(
  "/thanh_khoan_data/current/:type",
  miscDataController.getThanhKhoanCurrent
);

/**
 * 4. GET /thanh_khoan_data/historical/:type
 *    - Lấy dữ liệu thanh_khoan_data với date_type = 'historical' và type tương ứng
 *    - Params: type = "hose" | "hnx"
 *    - (Không yêu cầu JWT)
 */
router.get(
  "/thanh_khoan_data/historical/:type",
  miscDataController.getThanhKhoanHistorical
);

/**
 * 5. GET /report-chart
 *    - Lấy dữ liệu báo cáo (can_doi_ke_toan, luu_chuyen_tien_te, ket_qua_kinh_doanh) cho một symbol
 *    - Query: symbol
 *    - (Không yêu cầu JWT)
 */
router.get("/report-chart", miscDataController.getReportChart);

/**
 * 6. GET /sub-companies
 *    - Lấy danh sách công ty con (sub_company) theo parentSymbol
 *    - Query: symbol
 *    - (Không yêu cầu JWT)
 */
router.get("/sub-companies", miscDataController.getSubCompanies);

/**
 * 7. GET /leadership
 *    - Lấy danh sách lãnh đạo (leadership) theo symbol
 *    - Query: symbol
 *    - (Không yêu cầu JWT)
 */
router.get("/leadership", miscDataController.getLeadership);

/**
 * 8. GET /company-statistic
 *    - Lấy thống kê công ty (company_statistic) theo symbol
 *    - Query: symbol
 *    - (Không yêu cầu JWT)
 */
router.get("/company-statistic", miscDataController.getCompanyStatistic);

/**
 * 9. POST /nhom-nganh
 *    - Lấy nhóm ngành (superSector) từ bảng info_company theo mảng symbols
 *    - Body: { symbols: [<symbol>] }
 *    - (Không yêu cầu JWT)
 */
router.post("/nhom-nganh", miscDataController.getSuperSectors);

/**
 * 10. GET /get-my-filter
 *     - Lấy bộ lọc cá nhân (my_filter) theo userId
 *     - JWT required
 */
router.get("/get-my-filter", authenticateToken, miscDataController.getMyFilter);

/**
 * 11. POST /add-my-filter
 *     - Thêm mới một bộ lọc vào bảng my_filter
 *     - Body: { fieldName, conditions, userId }  (userId lấy từ token)
 *     - JWT required
 */
router.post(
  "/add-my-filter",
  authenticateToken,
  miscDataController.addMyFilter
);

/**
 * 12. PUT /update-my-filter/:id
 *     - Cập nhật một bộ lọc trong bảng my_filter
 *     - Params: id = filterID
 *     - Body: { fieldName, conditions }
 *     - JWT required
 */
router.put(
  "/update-my-filter/:id",
  authenticateToken,
  miscDataController.updateMyFilter
);

/**
 * 13. GET /get-config-filter
 *     - Lấy cấu hình bộ lọc (setting_conditions) của user hiện tại
 *     - JWT required
 */
router.get(
  "/get-config-filter",
  authenticateToken,
  miscDataController.getConfigFilter
);

/**
 * 14. GET /get-news
 *     - Lấy tất cả tin tức từ bảng news_all
 *     - (Không yêu cầu JWT)
 */
router.get("/get-news", miscDataController.getAllNews);

module.exports = router;

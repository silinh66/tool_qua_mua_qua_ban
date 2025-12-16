// routes/commodityAndCompany.js
const express = require("express");
const router = express.Router();
const commodityAndCompanyController = require("../controllers/commodityAndCompanyController");

/**
 * 1. GET /list-company
 *    - Lấy toàn bộ danh sách công ty từ bảng organization
 *    - (Không yêu cầu JWT)
 */
router.get("/list-company", commodityAndCompanyController.getListCompany);

/**
 * 2. GET /company-info
 *    - Query: symbol  (nếu thiếu → lỗi 400)
 *    - SELECT * FROM info_company WHERE symbol = ?
 *    - (Không yêu cầu JWT)
 */
router.get("/company-info", commodityAndCompanyController.getCompanyInfo);

/**
 * 3. GET /news
 *    - Query: symbol  (nếu thiếu → lỗi 400)
 *    - SELECT * FROM news WHERE symbol = ?
 *    - (Không yêu cầu JWT)
 */
router.get("/news", commodityAndCompanyController.getNewsBySymbol);

/**
 * 4. GET /gia_heo
 *    - SELECT * FROM gia_heo
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_heo", commodityAndCompanyController.getGiaHeo);

/**
 * 5. GET /gia_thep
 *    - SELECT * FROM gia_thep
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_thep", commodityAndCompanyController.getGiaThep);

/**
 * 6. GET /gia_gao
 *    - SELECT * FROM gia_gao
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_gao", commodityAndCompanyController.getGiaGao);

/**
 * 7. GET /gia_ca_tra
 *    - SELECT * FROM gia_ca_tra
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_ca_tra", commodityAndCompanyController.getGiaCaTra);

/**
 * 8. GET /dau_tu_nuoc_ngoai_tinh_thanh
 *    - SELECT stt, thanhPho, `code`, tongVonDangKy, `time`
 *      FROM dau_tu_nuoc_ngoai
 *      WHERE YEAR(STR_TO_DATE(CONCAT(time, '_01'), '%Y_%m_%d')) BETWEEN 2018 AND 2024
 *    - (Không yêu cầu JWT)
 */
router.get(
  "/dau_tu_nuoc_ngoai_tinh_thanh",
  commodityAndCompanyController.getDauTuNuocNgoaiTinhThanh
);

/**
 * 9. GET /von_dau_tu_tinh_thanh
 *    - SELECT * FROM von_dau_tu
 *    - (Không yêu cầu JWT)
 */
router.get(
  "/von_dau_tu_tinh_thanh",
  commodityAndCompanyController.getVonDauTuTinhThanh
);

/**
 * 10. GET /gia_phan
 *     - SELECT * FROM gia_phan
 *     - (Không yêu cầu JWT)
 */
router.get("/gia_phan", commodityAndCompanyController.getGiaPhan);

module.exports = router;

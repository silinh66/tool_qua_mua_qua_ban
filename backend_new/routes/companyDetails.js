// routes/companyDetails.js
const express = require("express");
const router = express.Router();
const companyDetailsController = require("../controllers/companyDetailsController");
/**
 * 6. POST /filter-data
 *    - Filter full: gọi API extern “GetDataByFilter” và trả về kết quả
 *    - Body: object (truyền nguyên request body)
 *    - (Không yêu cầu JWT)
 */
router.post("/filter-data", companyDetailsController.filterDataFull);

/**
 * 7. POST /filter-data-new
 *    - Filter mới: gọi API extern “GetScreenerItems” và trả về kết quả
 *    - Body: object (truyền nguyên request body)
 *    - (Không yêu cầu JWT)
 */
router.post("/filter-data-new", companyDetailsController.filterDataNew);

module.exports = router;

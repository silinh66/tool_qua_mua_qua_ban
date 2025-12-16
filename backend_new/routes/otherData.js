// routes/otherData.js
const express = require("express");
const router = express.Router();
const otherDataController = require("../controllers/otherDataController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. GET /gia_dien
 *    - Lấy dữ liệu từ bảng gia_dien
 *    - (Không yêu cầu JWT)
 */
router.get("/gia_dien", otherDataController.getElectricityPrices);

/**
 * 2. GET /financial_analysis
 *    - Lấy báo cáo tài chính theo organCode (symbol) từ query param
 *    - Query: symbol  (nếu thiếu → lỗi 400)
 *    - (Không yêu cầu JWT)
 */
router.get("/financial_analysis", otherDataController.getFinancialAnalysis);

/**
 * 3. GET /giaVang
 *    - Lấy dữ liệu giá vàng từ bảng gold_price
 *    - (Không yêu cầu JWT)
 */
router.get("/giaVang", otherDataController.getGoldPrices);

//getLatestGoldPricesSimple
router.get("/giaVang/latest", otherDataController.getLatestGoldPricesSimple);

/**
 * NEW: 3b. GET /giaVangChart (or /gold-chart)
 *    - Lấy toàn bộ dữ liệu từ bảng gold_chart_chogia
 *    - Sắp xếp theo price_date DESC, company ASC
 *
 *  Gợi ý route: router.get('/giaVangChart', otherDataController.getGoldChartAll)
 */
router.get("/giaVangChart", otherDataController.getGoldChartAll);
/**
 * 4. GET /lai_suat
 *    - Lấy dữ liệu lãi suất từ bảng lai_suat
 *    - (Không yêu cầu JWT)
 */
router.get("/lai_suat", otherDataController.getInterestRates);

/**
 * 5. GET /news-all
 *    - Lấy tất cả bài news_all với điều kiện date = hôm nay hoặc ngày hôm qua
 *    - (Không yêu cầu JWT)
 */
router.get("/news-all", otherDataController.getNewsAll);

/**
 * 6. GET /news-type
 *    - Lấy bài news theo type, có hỗ trợ paging (limit, page)
 *    - Query: type, limit (mặc định 12), page (mặc định 1)
 *    - Nếu type là “Bất động sản”, “Tài chính” hoặc “Công nghệ” sẽ dùng bảng news_all_detail
 *    - (Không yêu cầu JWT)
 */
router.get("/news-type", otherDataController.getNewsByType);

/**
 * 7. GET /lai_suat_online
 *    - Lấy dữ liệu từ bảng lai_suat_online
 *    - (Không yêu cầu JWT)
 */
router.get("/lai_suat_online", otherDataController.getInterestRatesOnline);

/**
 * 8. GET /top_gdnn_rong_ban/:type
 *    - Lấy dữ liệu top giao dịch khối ngoại bán ròng, gọi API extern nếu lỗi fallback về local
 *    - Params: type = "hose" | "hnx"
 *    - (Không yêu cầu JWT)
 */
router.get(
  "/top_gdnn_rong_ban/:type",
  otherDataController.getTopNetForeignSell
);

/**
 * 9. GET /top_gdnn_rong_mua/:type
 *    - Lấy dữ liệu top giao dịch khối ngoại mua ròng, gọi API extern nếu lỗi fallback về local
 *    - Params: type = "hose" | "hnx"
 *    - (Không yêu cầu JWT)
 */
router.get("/top_gdnn_rong_mua/:type", otherDataController.getTopNetForeignBuy);

/**
 * 10. GET /reports
 *     - Lấy danh sách reports (báo cáo) theo organCode
 *     - Query: symbol  (nếu thiếu → lỗi 400)
 *     - (Không yêu cầu JWT)
 */
router.get("/reports", otherDataController.getReportsBySymbol);

/**
 * 11. GET /news-detail
 *    - Lấy chi tiết bài news theo id
 *   - Query: id (nếu thiếu → lỗi 400)
 *   - (Không yêu cầu JWT)
 */
router.post("/news-detail", otherDataController.getNewsDetail);

module.exports = router;

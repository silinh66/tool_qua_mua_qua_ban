// routes/marketData.js
const express = require("express");
const router = express.Router();
const marketDataController = require("../controllers/marketDataController");
const authenticateToken = require("../middlewares/auth");

/**
 * 1. PUT /iboard_detail/:id
 *    - Cập nhật một iboard_detail
 *    - Params: id = detailID
 *    - Body: { list_symbol }
 *    - JWT required
 */
router.put(
  "/iboard_detail/:id",
  authenticateToken,
  marketDataController.updateIboardDetail
);

/**
 * 2. DELETE /iboard_detail/:id
 *    - Xóa một iboard_detail
 *    - Params: id = detailID
 *    - JWT required
 */
router.delete(
  "/iboard_detail/:id",
  authenticateToken,
  marketDataController.deleteIboardDetail
);

/**
 * 3. GET /symbol_info
 *    - Lấy thông tin từ bảng symbol_info, lọc theo query param ‘query’
 *      (nếu không có query → trả hết, sau đó filter trên logic JS)
 */
router.get("/symbol_info", marketDataController.getSymbolInfo);

/**
 * 4. GET /stocks/iboard
 *    - Đọc file JSON ‘iboard.json’ và trả về nội dung
 */
router.get("/stocks/iboard", marketDataController.getStocksIboard);

/**
 * 5. GET /statistics/company/stock-price
 *    - Lấy dữ liệu bảng stock_price có pagination
 *    - Query params: symbol, page, pageSize, fromDate, toDate
 */
router.get(
  "/statistics/company/stock-price",
  marketDataController.getCompanyStockPrice
);

/**
 * 6. GET /bao_cao_phan_tich
 *    - Lấy từ bảng bao_cao_phan_tich theo query param ‘symbol’
 */
router.get("/bao_cao_phan_tich", marketDataController.getAnalysisReports);

/**
 * 7. GET /mua_ban_chu_dong
 *    - SELECT * FROM mua_ban_chu_dong WHERE symbol = ? ORDER BY Time DESC
 *    - Query param: symbol
 */
router.get("/mua_ban_chu_dong", marketDataController.getMuaBanChuDong);

/**
 * 8. GET /mua_ban_chu_dong_short
 *    - Gọi hai API extern:
 *      * https://api.finpath.vn/api/stocks/v2/trades/${symbol}?page=1&pageSize=3000
 *      * https://api.finpath.vn/api/stocks/orderbook/${symbol}
 *    - Sau đó merge dữ liệu trades + orderbook, sort theo time
 *    - Query param: symbol
 */
router.get(
  "/mua_ban_chu_dong_short",
  marketDataController.getMuaBanChuDongShort
);

/**
 * 8.5. GET /indexes-overview
 *    - Gọi API extern:
 *      * https://api.finpath.vn/api/indexes/v2/overview
 */
router.get("/indexes-overview", marketDataController.getIndexesOverview);

/**
 * 8.6. GET /propdata/:symbol
 */
router.get("/propdata/:symbol", marketDataController.getPropdata);
/**
 * 9. GET /world-indices
 *    - Crawl “https://investing.com/indices/world-indices” bằng cheerio
 *      chỉ lấy một số tên chỉ số quen thuộc
 */
router.get("/world-indices", marketDataController.getWorldIndices);

/**
 * 10. GET /goods-price
 *     - Crawl “https://investing.com/commodities/real-time-futures” bằng cheerio
 *       chỉ lấy một số mặt hàng quen thuộc (Gold, Silver, …)
 */
router.get("/goods-price", marketDataController.getGoodsPrice);

module.exports = router;

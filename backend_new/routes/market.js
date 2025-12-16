// routes/market.js
const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");

/**
 * 6. GET /market/Securities
 *    - Lấy danh sách chứng khoán (SECURITIES) từ API gốc.
 *    - Query params: pageIndex, pageSize
 */
router.get("/Securities", marketController.getSecurities);

/**
 * 7. GET /market/SecuritiesDetails
 *    - Lấy chi tiết chứng khoán (SECURITIESDETAILS) từ API gốc.
 *    - Query params: pageIndex, pageSize
 */
router.get("/SecuritiesDetails", marketController.getSecuritiesDetails);

/**
 * 8. GET /market/IndexComponents
 *    - Lấy danh sách thành phần của một chỉ số (INDEXCOMPONENTS).
 *    - Query params: indexCode (mặc định: ""), pageIndex (mặc định: 1), pageSize (mặc định: 1000)
 */
router.get("/IndexComponents", marketController.getIndexComponents);

/**
 * 9. GET /market/IndexList
 *    - Lấy danh sách các chỉ số (INDEXLIST).
 *    - Query params: exchange (mặc định: "HOSE"), pageIndex (mặc định: 1), pageSize (mặc định: 1000)
 */
router.get("/IndexList", marketController.getIndexList);

/**
 * 10. GET /market/DailyOhlc
 *     - Lấy dữ liệu OHLC hàng ngày (DAILYOhlc).
 *     - Query params: symbol, fromDate, toDate, pageIndex (default 1), pageSize (default 1000), ascending (true)
 */
router.get("/DailyOhlc", marketController.getDailyOhlc);

/**
 * 11. GET /market/IntradayOhlc
 *     - Lấy dữ liệu OHLC nội phiên (IntradayOhlc).
 *     - Query params: symbol, fromDate, toDate, pageIndex (default 1), pageSize (default 5000), ascending (default false)
 */
router.get("/IntradayOhlc", marketController.getIntradayOhlc);

/**
 * 12. GET /market/DailyIndex
 *     - Lấy dữ liệu chỉ số hàng ngày (DailyIndex).
 *     - **Lưu ý**: main.js ghi cứng indexId, fromDate, toDate trong code gốc.
 */
router.get("/DailyIndex", marketController.getDailyIndex);

/**
 * 13. GET /market/DailyStockPrice
 *     - Lấy giá cổ phiếu hàng ngày (DailyStockPrice).
 *     - Query params: symbol, fromDate, toDate, market (mặc định ""), pageIndex (1), pageSize (1000)
 */
router.get("/DailyStockPrice", marketController.getDailyStockPrice);

module.exports = router;

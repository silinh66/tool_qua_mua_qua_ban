// routes/dataFeed.js
const express = require("express");
const router = express.Router();
const dataFeedController = require("../controllers/dataFeedController");

/**
 * 1. GET /dataFeed/history
 *    - Lấy dữ liệu lịch sử (candlestick) cho chart TradingView.
 *    - Query params: symbol, resolution, from, to, countback
 */
router.get("/history", dataFeedController.getHistory);

/**
 * 2. GET /dataFeed/search
 *    - Tìm kiếm ticker (fetch từ VNDIRECT).
 *    - Query params: limit, query
 */
router.get("/search", dataFeedController.search);

/**
 * 3. GET /dataFeed/symbols
 *    - Lấy danh sách thông tin symbol (từ DB bảng symbol_info).
 *    - Query params: symbol (có thể null)
 */
router.get("/symbols", dataFeedController.getSymbols);

/**
 * 4. GET /dataFeed/config
 *    - Trả về cấu hình TradingView để frontend biết có những tính năng gì hỗ trợ.
 */
router.get("/config", dataFeedController.getConfig);

/**
 * 5. GET /dataFeed/time
 *    - Trả về thời gian server (Unix timestamp).
 */
router.get("/time", dataFeedController.getTime);

module.exports = router;

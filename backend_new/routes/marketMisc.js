// routes/marketMisc.js
const express = require("express");
const router = express.Router();
const marketMiscController = require("../controllers/marketMiscController");

/**
 * 90. GET /financial-ratio
 *     - Query: symbol, type ('year' hoặc 'quarter').
 */
router.get("/financial-ratio", marketMiscController.getFinancialRatio);

/**
 * 91. GET /co-dong
 *     - Query: symbol
 */
router.get("/co-dong", marketMiscController.getCoDong);

/**
 * 92. GET /pe-nganh
 *     - Trả về { success: true, data: [] } (hiện chưa có data).
 */
router.get("/pe-nganh", marketMiscController.getPeNganh);

/**
 * 93. GET /data-vi-mo
 *     - Lấy dữ liệu vĩ mô (GDP, CPI, XNK, FDI, v.v.).
 */
router.get("/data-vi-mo", marketMiscController.getDataViMo);

module.exports = router;

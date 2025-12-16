const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth");
const trendlineAlertController = require("../controllers/trendlineAlertController");

router.post("/", authenticateToken, trendlineAlertController.createTrendlineAlert);
router.put("/:id", authenticateToken, trendlineAlertController.updateTrendlineAlert);
router.delete("/:id", authenticateToken, trendlineAlertController.deleteTrendlineAlert);
router.get("/:symbol", authenticateToken, trendlineAlertController.getTrendlineAlertsBySymbol);

module.exports = router;

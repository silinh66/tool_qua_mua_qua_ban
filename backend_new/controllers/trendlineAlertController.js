const queryMySQL = require("../utils/queryMySQL");
const uuidv4 = async () => {
  const { v4 } = await import('uuid');
  return v4();
};

// 🟢 CREATE new alert (tick ON) - supports trendline OR price alert
exports.createTrendlineAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { symbol, lineId, a, b, side, target_price } = req.body;
console.log(req.body);

    // nếu client không gửi lineId, tạo 1 id riêng (ưu tiên khách gửi lineId)
    const clientLineId = lineId || (target_price ? `${symbol}_PRICE_${side || 'any'}` : `TL_${uuidv4()}`);

    const alertType = target_price ? "price" : "trendline";
    const last_position_init = target_price ? null : side; // khởi tạo lại null để backend tự detect

    const sql = `
      INSERT INTO trendline_alerts 
      (user_id, symbol, client_line_id, a, b, side, target_price, alert_type, enabled, last_position, notified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0)
      ON DUPLICATE KEY UPDATE 
        a=VALUES(a), b=VALUES(b), side=VALUES(side), target_price=VALUES(target_price),
        alert_type=VALUES(alert_type), enabled=1, notified=0
    `;
    const params = [
      userId,
      symbol,
      clientLineId,
      a || null,
      b || null,
      side || null,
      target_price || null,
      alertType,
      last_position_init,
    ];

    const result = await queryMySQL(sql, params);

    // result may be [result] depending on your queryMySQL wrapper — return id
    const insertedId = result?.insertId ?? (result?.[0]?.insertId ?? null);
    console.log('insertedId', insertedId);


    res.json({ success: true, id: insertedId, client_line_id: clientLineId });
  } catch (err) {
    console.error("Create trendline alert failed:", err);
    next(err);
  }
};

// 🟡 UPDATE alert (tick OFF, move line, update price)
exports.updateTrendlineAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { a, b, side, enabled, target_price, alert_type } = req.body;

    await queryMySQL(
      `UPDATE trendline_alerts 
       SET a=?, b=?, side=?, enabled=?, target_price=?, alert_type=?,
           notified = CASE WHEN ? = 1 THEN 0 ELSE notified END
       WHERE id=? AND user_id=?`,
      [a || null, b || null, side || null, enabled, target_price || null, alert_type || null, enabled, id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update trendline alert failed:", err);
    next(err);
  }
};

// 🔴 DELETE alert (xoá khỏi DB khi người dùng xoá line trên chart)
exports.deleteTrendlineAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await queryMySQL("DELETE FROM trendline_alerts WHERE id=? AND user_id=?", [
      id,
      userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete trendline alert failed:", err);
    next(err);
  }
};

// 🔵 GET all alerts of a symbol
exports.getTrendlineAlertsBySymbol = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.params;

    const rows = await queryMySQL(
      "SELECT * FROM trendline_alerts WHERE user_id=? AND symbol=?",
      [userId, symbol]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Get alerts failed:", err);
    next(err);
  }
};

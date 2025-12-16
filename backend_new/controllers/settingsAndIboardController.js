// controllers/settingsAndIboardController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 1. GET /user/settings
 *    - Lấy tất cả cài đặt (bo_loc_ky_thuat) của user hiện tại
 */
exports.getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const boLocKyThuat = await queryMySQL(
      "SELECT * FROM bo_loc_ky_thuat WHERE userID = ?",
      [userId]
    );
    res.send({ success: true, data: boLocKyThuat });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /settings/updateConditions
 *    - Cập nhật (insert hoặc upsert) danh sách điều kiện kỹ thuật
 *    - Body: { listTieuChi: [ { settingID, name, value }, ... ] }
 */
exports.updateTechnicalConditions = async (req, res, next) => {
  try {
    const { listTieuChi } = req.body;
    const userId = req.user.userId;
    for (const condition of conditions) {
      await queryMySQL(
        `
      INSERT INTO setting_conditions (settingID, name, value)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE value = VALUES(value)
    `,
        [settingID, condition.name, condition.value]
      );
    }
    res.send({ success: true, message: "Conditions updated successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. POST /input_quan_tri_von
 *    - Thêm mới record cho bảng input_quan_tri_von
 *    - Body: { data: { ...fields } }
 */
exports.insertInputQuanTriVon = async (req, res, next) => {
  try {
    let data = req.body.data;
    if (!data) {
      return res
        .status(400)
        .send({ error: true, message: "Please provide data" });
    }
    await queryMySQL("INSERT INTO input_quan_tri_von SET ?", data);
    res.send({ error: false, data: data, message: "Cập nhật thành công" });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. GET /input_quan_tri_von
 *    - Lấy bản ghi mới nhất của input_quan_tri_von
 */
exports.getInputQuanTriVon = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM input_quan_tri_von");
    res.send({
      error: false,
      data: data[data.length - 1],
      message: "input_quan_tri_von list.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /iboards
 *    - Lấy tất cả iBoards của user hiện tại
 */
exports.getIboards = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const boards = await queryMySQL("SELECT * FROM iboard WHERE userID = ?", [
      userID,
    ]);
    res.json({ success: true, boards });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. POST /iboard
 *    - Tạo mới một iBoard
 *    - Body: { title }
 */
exports.createIboard = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const { title } = req.body;
    if (!title || !userID) {
      return res
        .status(400)
        .send({ error: true, message: "Missing title or userID" });
    }
    await queryMySQL("INSERT INTO iboard (title, userID) VALUES (?, ?)", [
      title,
      userID,
    ]);
    res.send({ success: true, message: "iboard created successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. PUT /iboard/:id
 *    - Cập nhật tiêu đề một iBoard
 *    - Params: id = iboardID
 *    - Body: { title }
 */
exports.updateIboard = async (req, res, next) => {
  try {
    const { title } = req.body;
    const { id } = req.params;
    await queryMySQL("UPDATE iboard SET title = ? WHERE id = ?", [title, id]);
    res.send({ success: true, message: "iboard updated successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. DELETE /iboard/:id
 *    - Xóa một iBoard
 *    - Params: id = iboardID
 */
exports.deleteIboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await queryMySQL("DELETE FROM iboard WHERE id = ?", [id]);
    res.send({ success: true, message: "iboard deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. GET /iboard_details/:iboardID
 *    - Lấy danh sách symbols trong một iBoard
 *    - Params: iboardID
 */
exports.getIboardDetails = async (req, res, next) => {
  try {
    const { iboardID } = req.params;
    const details = await queryMySQL(
      "SELECT * FROM iboard_detail WHERE iboardID = ?",
      [iboardID]
    );
    res.json({ success: true, details });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. POST /iboard_detail
 *     - Thêm mới symbol vào iBoard
 *     - Body: { iboardID, list_symbol }
 */
exports.addIboardDetail = async (req, res, next) => {
  try {
    const { iboardID, list_symbol } = req.body;
    if (!iboardID || !list_symbol) {
      return res.status(400).send({
        error: true,
        message: "Please provide iboardID and list_symbol",
      });
    }
    await queryMySQL(
      "INSERT INTO iboard_detail (iboardID, list_symbol) VALUES (?, ?)",
      [iboardID, list_symbol]
    );
    res.send({
      success: true,
      message: "Symbol added to iboard_detail successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /user/favorites
 */
exports.getUserFavorites = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const rows = await queryMySQL(
      "SELECT symbol, exchange, snapshot, created_at, updated_at FROM user_favorites WHERE userID = ? ORDER BY updated_at DESC",
      [userID]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /user/favorites
 * Body: { symbol, exchange, snapshot }
 */
exports.addOrUpdateFavorite = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const { symbol, exchange = null, snapshot = null } = req.body;
    if (!symbol) {
      return res.status(400).json({ success: false, message: "Missing symbol" });
    }
    // upsert: insert or update snapshot
    await queryMySQL(
      `INSERT INTO user_favorites (userID, symbol, exchange, snapshot)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE exchange = VALUES(exchange), snapshot = VALUES(snapshot), updated_at = CURRENT_TIMESTAMP`,
      [userID, symbol, exchange, JSON.stringify(snapshot)]
    );
    res.json({ success: true, message: "Favorite saved" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /user/favorites/:symbol
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const { symbol } = req.params;
    if (!symbol) return res.status(400).json({ success: false, message: "Missing symbol" });
    await queryMySQL("DELETE FROM user_favorites WHERE userID = ? AND symbol = ?", [userID, symbol]);
    res.json({ success: true, message: "Favorite removed" });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /user/favorites/batch
 * Body: { list: [ { symbol, exchange, snapshot }, ... ] }
 * We'll do batch upsert using multiple VALUES and ON DUPLICATE KEY
 */
exports.batchUpsertFavorites = async (req, res, next) => {
  try {
    const userID = req.user.userId;
    const { list } = req.body;
    if (!Array.isArray(list)) return res.status(400).json({ success: false, message: "list must be array" });
    if (list.length === 0) return res.json({ success: true, message: "No items to update" });

    // Build multi-row insert
    const values = [];
    const params = [];
    for (const item of list) {
      values.push("(?, ?, ?, ?)");
      params.push(userID, item.symbol, item.exchange || null, JSON.stringify(item.snapshot || null));
    }
    const sql = `
      INSERT INTO user_favorites (userID, symbol, exchange, snapshot)
      VALUES ${values.join(",")}
      ON DUPLICATE KEY UPDATE
        exchange = VALUES(exchange),
        snapshot = VALUES(snapshot),
        updated_at = CURRENT_TIMESTAMP
    `;
    await queryMySQL(sql, params);
    res.json({ success: true, message: "Batch favorites updated" });
  } catch (err) {
    next(err);
  }
};

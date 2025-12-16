// controllers/commodityAndCompanyController.js
const queryMySQL = require("../utils/queryMySQL");

// Helper chạy queryMySQL promise-based với mysql2/promise
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. GET /list-company
 *    - Lấy toàn bộ danh sách công ty từ bảng organization
 *    - (Không yêu cầu JWT)
 */
exports.getListCompany = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM organization");
    res.send({ error: false, data: data, message: "company list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /company-info
 *    - queryMySQL: symbol  (nếu thiếu → lỗi 400)
 *    - SELECT * FROM info_company WHERE symbol = ?
 *    - (Không yêu cầu JWT)
 */
exports.getCompanyInfo = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL("SELECT * FROM info_company WHERE symbol = ?", [
      symbol,
    ]);
    res.send({ error: false, data: data, message: "company info." });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET /news
 *    - queryMySQL: symbol  (nếu thiếu → lỗi 400)
 *    - SELECT * FROM news WHERE symbol = ?
 *    - (Không yêu cầu JWT)
 */
exports.getNewsBySymbol = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL("SELECT * FROM news WHERE symbol = ?", [
      symbol,
    ]);
    res.send({ error: false, data: data, message: "news list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. GET /gia_heo
 *    - SELECT * FROM gia_heo
 *    - (Không yêu cầu JWT)
 */
exports.getGiaHeo = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_heo ");
    res.send({ error: false, data: data, message: "gia_heo list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /gia_thep
 *    - SELECT * FROM gia_thep
 *    - (Không yêu cầu JWT)
 */
exports.getGiaThep = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_thep ");
    res.send({ error: false, data: data, message: "gia_thep list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. GET /gia_gao
 *    - SELECT * FROM gia_gao
 *    - (Không yêu cầu JWT)
 */
exports.getGiaGao = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_gao ");
    res.send({ error: false, data: data, message: "gia_gao list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /gia_ca_tra
 *    - SELECT * FROM gia_ca_tra
 *    - (Không yêu cầu JWT)
 */
exports.getGiaCaTra = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_ca_tra ");
    res.send({ error: false, data: data, message: "gia_ca_tra list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /dau_tu_nuoc_ngoai_tinh_thanh
 *    - SELECT stt, thanhPho, `code`, tongVonDangKy, `time`
 *      FROM dau_tu_nuoc_ngoai
 *      WHERE YEAR(STR_TO_DATE(CONCAT(time, '_01'), '%Y_%m_%d')) BETWEEN 2018 AND 2024
 *    - (Không yêu cầu JWT)
 */
exports.getDauTuNuocNgoaiTinhThanh = async (req, res, next) => {
  try {
    let data = await queryMySQL(
      "SELECT stt,thanhPho, `code`, tongVonDangKy , `time`  FROM dau_tu_nuoc_ngoai WHERE YEAR(STR_TO_DATE(CONCAT(time, '_01'), '%Y_%m_%d')) BETWEEN 2018 AND 2024"
    );
    res.send({ error: false, data: data, message: "dau_tu_nuoc_ngoai list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. GET /von_dau_tu_tinh_thanh
 *    - SELECT * FROM von_dau_tu
 *    - (Không yêu cầu JWT)
 */
exports.getVonDauTuTinhThanh = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT *  FROM von_dau_tu ");
    res.send({ error: false, data: data, message: "dau_tu_nuoc_ngoai list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. GET /gia_phan
 *     - SELECT * FROM gia_phan
 *     - (Không yêu cầu JWT)
 */
exports.getGiaPhan = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_phan ");
    res.send({ error: false, data: data, message: "gia_phan list." });
  } catch (err) {
    next(err);
  }
};

// controllers/infoController.js
const queryMySQL = require("../utils/queryMySQL");
const axios = require("axios");
const bcrypt = require("bcrypt");
const admin = require("../middlewares/firebase");
const sendMulticastNotification = require("../utils/sendNoti");
/**
 * 24. GET /stock-overview
 */
exports.getStockOverview = async (req, res, next) => {
  try {
    const rows = await queryMySQL("SELECT * FROM stock_overview");
    return res.json({
      error: false,
      data: rows,
      message: "Danh sách stock_overview",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 25. GET /stock-overview/:id
 */
exports.getStockOverviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await queryMySQL("SELECT * FROM stock_overview WHERE c = ?", [
      id,
    ]);
    return res.json({
      error: false,
      data: rows,
      message: "Chi tiết stock_overview",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 26. GET /info-company
 */
exports.getInfoCompany = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM info_company");
    let mapData = data.map((item, index) => {
      return {
        ...item,
        image: `https://cdn02.wigroup.vn/logo_company/${item?.symbol}.jpeg`,
      };
    });
    res.send({ error: false, data: mapData, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 27. GET /info-company-follow
 *     - Cần JWT để xác định user.
 *     - Giả sử có table company_follows(user_id, symbol).
 *     - Trả về từng công ty kèm isFollowed = 1 hoặc 0.
 */
exports.getInfoCompanyFollow = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Assuming authenticateToken middleware sets req.user
    let data = await queryMySQL("SELECT * FROM info_company");
    let dataFollow = await queryMySQL(
      "SELECT * FROM follows_topic WHERE userId = ?",
      [userId]
    );
    let dataMap = data?.map((item, index) => {
      return {
        ...item,
        image: `https://cdn02.wigroup.vn/logo_company/${item?.symbol}.jpeg`,
        isFollow: dataFollow.find((itemFollow) => {
          return itemFollow.symbol === item.symbol;
        })
          ? true
          : false,
      };
    });
    res.send({ error: false, data: dataMap, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 28. GET /users/getConfig
 *     - Lấy config cá nhân user (bảng user_configs).
 */
exports.getUserConfig = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userConfig = await queryMySQL(
      "SELECT config FROM user_configs WHERE userId = ?",
      [userId]
    );
    if (userConfig.length > 0) {
      res.send({ success: true, config: userConfig[0].config });
    } else {
      res
        .status(404)
        .send({ success: false, message: "Configuration not found." });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 29. GET /top20/:type
 *     - Lấy từ bảng top20_{type}.
 */
exports.getTop20 = async (req, res, next) => {
  try {
    let type = req.params.type;
    let data = await queryMySQL(`SELECT * FROM top20_${type}`);
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 9 && hours > 8) {
      data = data?.map((item, index) => {
        return {
          symbol: "",
          point: 0,
        };
      });
    }
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 30. GET /change_count/:type
 */
exports.getChangeCount = async (req, res, next) => {
  try {
    let type = req.params.type;
    let data = await queryMySQL(
      "SELECT * FROM change_count where `index` = ?",
      [type]
    );
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 9 && hours > 7) {
      data =
        type === "VNINDEX"
          ? [
              {
                index: "VNINDEX",
                noChange: 0,
                decline: 0,
                advance: 0,
                time: "14:45:08",
              },
            ]
          : [
              {
                index: "HNX",
                noChange: 0,
                decline: 0,
                advance: 0,
                time: "14:45:08",
              },
            ];
    }
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 31. GET /nuoc_ngoai
 */
exports.getNuocNgoai = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM nuoc_ngoai");
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 32. GET /nuoc_ngoai_all
 */
exports.getNuocNgoaiAll = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM nuoc_ngoai_all");
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 33. GET /tu_doanh
 */
exports.getTuDoanh = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * from tu_doanh");
    res.send({ error: false, data: data, message: "success" });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 35. GET /tu_doanh_all
exports.getTuDoanhAll = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM tu_doanh_all");
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 36. GET /statistics
exports.getStatistics = async (req, res, next) => {
  try {
    let onlineCount = await queryMySQL(
      "SELECT COUNT(*) as onlineCount FROM users WHERE isOnline = 1"
    );
    let totalCount = await queryMySQL(
      "SELECT COUNT(*) as totalCount FROM users"
    );
    let groupCount = await queryMySQL(
      "SELECT COUNT(DISTINCT symbol_name) as groupCount FROM topics"
    );
    let postCount = await queryMySQL(
      "SELECT COUNT(*) as postCount FROM topics"
    );
    let data = {
      onlineCount: onlineCount[0].onlineCount,
      totalCount: totalCount[0].totalCount,
      groupCount: groupCount[0].groupCount,
      postCount: postCount[0].postCount,
    };
    res.send({ error: false, data: data, message: "config list." });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 37. GET /thanh_khoan_history/:type
exports.getThanhKhoanHistory = async (req, res, next) => {
  try {
    let { type } = req.params;
    type = type.toLowerCase();
    const allowed = ["hose", "hnx"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: true, message: "Invalid type." });
    }
    const tableName = `thanh_khoan_history_${type}`;
    const [rows] = await queryMySQL(`SELECT * FROM \`${tableName}\``);
    return res.json({
      error: false,
      data: rows,
      message: `Danh sách thanh_khoan_history_${type}`,
    });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 38. GET /thanh_khoan/:type
exports.getThanhKhoan = async (req, res, next) => {
  try {
    let { type } = req.params;
    type = type.toLowerCase();
    const allowed = ["hose", "hnx"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ error: true, message: "Invalid type." });
    }
    const tableName = `thanh_khoan_${type}`;
    const [rows] = await queryMySQL(`SELECT * FROM \`${tableName}\``);
    return res.json({
      error: false,
      data: rows,
      message: `Danh sách thanh_khoan_${type}`,
    });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 41. POST /register
//    - Body: { email, name, password, phone_number }
exports.registerUser = async (req, res, next) => {
  try {
    const { email, name, password, phone_number } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await queryMySQL(
      "INSERT INTO users (email, name, password, phone_number, createdOn, isOnline) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, hashedPassword, phone_number, new Date(), 0]
    );
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

// --------------------------------------------------
// 42. POST /register-token
//    - Body: { userID, token }
exports.registerDeviceToken = async (req, res, next) => {
  try {
    const { userID, token } = req.body;
    if (!userID || !token) {
      return res
        .status(400)
        .json({ error: true, message: "Missing userID or token." });
    }
    // Upsert device_tokens table (giả sử có cột user_id, token, updated_at)
    await queryMySQL(
      `INSERT INTO device_tokens (user_id, token)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE token = VALUES(token)`,
      [userID, token]
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 43. POST /send-notification
//    - Body: { title, body, data }
//    - Gửi notification đến tất cả device tokens trong DB, xóa token không hợp lệ
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, body, data = {} } = req.body;
    const [rows] = await queryMySQL(`SELECT token FROM device_tokens`);
    const tokens = rows.map((row) => row.token);

    // Gửi thông báo
    const { invalidTokens = [] } = await sendMulticastNotification(
      tokens,
      title,
      body,
      data
    );
    console.log("invalidTokens: ", invalidTokens);

    // Xoá token không hợp lệ
    if (invalidTokens.length > 0) {
      await queryMySQL(`DELETE FROM device_tokens WHERE token IN (?)`, [
        invalidTokens,
      ]);
      console.log("Removed invalid tokens:", invalidTokens.length);
    }

    res.json({
      success: true,
      sent: tokens.length,
      removed: invalidTokens.length,
    });
  } catch (err) {
    next(err);
  }
};

//dailyStockPrice
// --------------------------------------------------
// 44. GET /daily-stock-price/:symbol
exports.getDailyStockPrice = async (req, res, next) => {
  try {
    const { symbol, fromDate, toDate } = req.query;

    let response = await axios.get(
      `http://localhost:3000/market/DailyStockPrice?symbol=${symbol}&fromDate=${fromDate}&toDate=${toDate}`
    );
    let listSymbolData = response?.data?.data;
    res.send({
      error: false,
      data: listSymbolData,
      message: "DailyStockPrice list.",
    });
  } catch (err) {
    next(err);
  }
};

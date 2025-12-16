// controllers/accountAndConfigController.js
const queryMySQL = require("../utils/queryMySQL");

// Tiện ích chạy queryMySQL promise-based với mysql2/promise
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. GET /messages/:conversationId
 *    - Lấy tin nhắn trong conversation (group hoặc 1-1)
 *    - Params: conversationId
 *    - queryMySQL: type = "group" | "user"
 *    - JWT required
 */
exports.getConversationMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;
    const conversationType = req.query.type; // 'group' or 'user'

    let messages;
    if (conversationType === "group") {
      // Fetch messages from the group
      messages = await queryMySQL(
        "SELECT m.*, u.name, u.image as avatar FROM messages m JOIN users u ON m.sender_id = u.userID WHERE m.group_id = ? ORDER BY m.created_at DESC",
        [conversationId]
      );
    } else if (conversationType === "user") {
      // Fetch private conversation messages between the authenticated user and the specified user
      messages = await queryMySQL(
        "SELECT m.*, u.name, u.image as avatar FROM messages m JOIN users u ON m.sender_id = u.userID WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ORDER BY m.created_at DESC",
        [userId, conversationId, conversationId, userId]
      );
    } else {
      // Invalid type or not provided
      return res
        .status(400)
        .json({ error: true, message: "Invalid or missing conversation type" });
    }

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /createAccount
 *    - Tạo tài khoản mô phỏng (mock trading account)
 *    - Body: { accountName }
 *    - JWT required
 */
exports.createAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const accountName = req.body.accountName;

    // Initial balance and total profit loss are set as per your requirement
    const initialBalance = 500000000;
    const totalProfitLoss = 0;

    await queryMySQL(
      "INSERT INTO UserAccounts (userId, accountName, balance, totalProfitLoss) VALUES (?, ?, ?, ?)",
      [userId, accountName, initialBalance, totalProfitLoss]
    );

    res.status(201).send({ message: "Account created successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET /getAccountInfo
 *    - Lấy thông tin tài khoản mô phỏng: { accountName, balance, totalProfitLoss }
 *    - JWT required
 */
exports.getAccountInfo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      "SELECT accountName, balance, totalProfitLoss FROM UserAccounts WHERE userId = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "Account not found" });
    }

    res.send(result[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. POST /placeOrder
 *    - Đặt lệnh mua/bán chứng khoán (mock trading)
 *    - Body: { stockSymbol, transactionType, quantity, price }
 *    - transactionType: "BUY" | "SELL"
 *    - JWT required
 */
exports.placeOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { stockSymbol, transactionType, quantity, price } = req.body;

    // Tính tổng giá trị giao dịch
    const totalValue = quantity * price;

    // Truy vấn để lấy thông tin tài khoản
    const accountInfo = await queryMySQL(
      "SELECT accountName, balance, totalProfitLoss FROM UserAccounts WHERE userId = ?",
      [userId]
    );

    // Kiểm tra thông tin tài khoản
    if (accountInfo.length === 0) {
      throw new Error("Account information not found");
    }

    let updatedBalance = accountInfo[0].balance;

    // Trừ tiền nếu là lệnh mua
    if (transactionType === "buy") {
      if (updatedBalance < totalValue) {
        throw new Error("Insufficient balance to place order");
      }
      updatedBalance -= totalValue;

      // Cập nhật số dư tài khoản trong cơ sở dữ liệu
      await queryMySQL("UPDATE UserAccounts SET balance = ? WHERE userId = ?", [
        updatedBalance,
        userId,
      ]);
    }

    // Chèn lệnh giao dịch vào cơ sở dữ liệu
    await queryMySQL(
      "INSERT INTO Transactions (userId, stockSymbol, transactionType, quantity, price) VALUES (?, ?, ?, ?, ?)",
      [userId, stockSymbol, transactionType, quantity, price]
    );

    // Tạo phản hồi
    const response = {
      message: "Order placed successfully",
      accountName: accountInfo[0].accountName,
      balance: updatedBalance,
      totalProfitLoss: accountInfo[0].totalProfitLoss,
    };

    res.status(201).send(response);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /getPortfolio
 *    - Lấy danh mục (holdings) hiện tại của user (mock trading)
 *    - JWT required
 */
exports.getPortfolio = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      "SELECT stockSymbol, quantity, purchasePrice, currentPrice, profitLoss, profitLossPercentage FROM holdings WHERE userId = ?",
      [userId]
    );
    if (result.length === 0) {
      return res.status(404).send({ error: "No holdings found" });
    }

    res.send({ holdings: result });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. POST /user-config-insert
 *    - Thêm mới hoặc cập nhật cấu hình bộ lọc kỹ thuật cho user
 *    - Body: { listTieuChi: [ { field, operator, value, ... } ] }
 *    - JWT required
 */
exports.insertUserConfig = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Assuming `userId` is set by `authenticateToken` middleware
    const config = req.body;
    await queryMySQL(
      `
    INSERT INTO user_configs (userID, listPair, listInterval, Wiliams, DMI_ADX, MFI, RSI, RSIdown, Stoch, MACD, EMA, MA, RS, WiliamsValue, DMI_ADXValue, MFIValue, RSIValue, RSIdownValue, StochValue, MACDValue, EMAValue, MAValue, RSValue) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
    listPair = VALUES(listPair), 
    listInterval = VALUES(listInterval), 
    Wiliams = VALUES(Wiliams), 
    DMI_ADX = VALUES(DMI_ADX), 
    MFI = VALUES(MFI), 
    RSI = VALUES(RSI), 
    RSIdown = VALUES(RSIdown), 
    Stoch = VALUES(Stoch), 
    MACD = VALUES(MACD), 
    EMA = VALUES(EMA), 
    MA = VALUES(MA), 
    RS = VALUES(RS), 
    WiliamsValue = VALUES(WiliamsValue), 
    DMI_ADXValue = VALUES(DMI_ADXValue), 
    MFIValue = VALUES(MFIValue), 
    RSIValue = VALUES(RSIValue), 
    RSIdownValue = VALUES(RSIdownValue), 
    StochValue = VALUES(StochValue), 
    MACDValue = VALUES(MACDValue), 
    EMAValue = VALUES(EMAValue), 
    MAValue = VALUES(MAValue), 
    RSValue = VALUES(RSValue)
  `,
      [
        userId,
        JSON.stringify(config.listPair),
        JSON.stringify(config.listInterval),
        config.Wiliams,
        config.DMI_ADX,
        config.MFI,
        config.RSI,
        config.RSIdown,
        config.Stoch,
        config.MACD,
        config.EMA,
        config.MA,
        config.RS,
        config.WiliamsValue,
        config.DMI_ADXValue,
        config.MFIValue,
        config.RSIValue,
        config.RSIdownValue,
        config.StochValue,
        config.MACDValue,
        config.EMAValue,
        config.MAValue,
        config.RSValue,
      ]
    );

    res.send({ success: true, message: "Configuration updated successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /user-config-get
 *    - Lấy tất cả setting_conditions của user
 *    - JWT required
 */
exports.getUserConfig = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      "SELECT * FROM user_configs WHERE userID = ?",
      [userId]
    );
    if (result.length === 0) {
      return res.status(404).send({ error: "Configuration not found" });
    }

    res.send({ success: true, config: result[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. POST /user-config-share
 *    - Chia sẻ bộ lọc kỹ thuật tới nhiều user khác
 *    - Body: { configID, receiverIDs: [<userId>] }
 *    - JWT required
 */
exports.shareUserConfig = async (req, res, next) => {
  try {
    const ownerUserId = req.user.userId;
    const { configId, sharedWithUserIds } = req.body;
    // Vòng lặp qua mỗi userId để chia sẻ cấu hình
    for (const sharedWithUserId of sharedWithUserIds) {
      await queryMySQL(
        `
      INSERT INTO user_config_shares (config_id, owner_user_id, shared_with_user_id, status, created_at, updated_at) 
      VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
        [configId, ownerUserId, sharedWithUserId]
      );
    }

    res.send({ success: true, message: "Configuration shared successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. GET /user-config-share-requests
 *    - Lấy danh sách yêu cầu chia sẻ config mà user đang nhận
 *    - JWT required
 */
exports.listUserConfigShareRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      `SELECT ucs.share_id, ucs.config_id, ucs.owner_user_id, ucs.status, uc.*
         FROM user_config_shares ucs
         JOIN user_configs uc ON ucs.config_id = uc.userID
         WHERE ucs.shared_with_user_id = ? AND ucs.status = 'pending'`,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No share requests found" });
    }

    res.send({ success: true, shareRequests: result });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. POST /user-config-share-response
 *     - Phản hồi yêu cầu chia sẻ config
 *     - Body: { sharedID, status }  // status = "ACCEPTED" | "REJECTED"
 *     - JWT required
 */
exports.respondUserConfigShare = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { shareId, response } = req.body;
    await queryMySQL(
      `
        UPDATE user_config_shares 
        SET status = ? 
        WHERE share_id = ? AND shared_with_user_id = ?`,
      [response, shareId, userId]
    );

    res.send({ success: true, message: "Response recorded successfully" });
  } catch (err) {
    next(err);
  }
};

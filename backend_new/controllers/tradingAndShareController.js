// controllers/tradingAndShareController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * Helper: chạy queryMySQL promise-based
 */
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. GET /user-config-shared
 *    - Lấy danh sách config (bộ lọc kỹ thuật) đã share với user hiện tại.
 *    - Trả về mảng các config cùng thông tin sender.
 */
exports.getUserConfigShared = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      `
        SELECT uc.* FROM user_configs uc
        INNER JOIN user_config_shares ucs ON uc.userID = ucs.owner_user_id
        WHERE ucs.shared_with_user_id = ? AND ucs.status = 'accepted'`,
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No shared configuration found" });
    }

    res.send({ success: true, sharedConfigs: result });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. POST /matchOrder
 *    - Khớp lệnh: cập nhật balance + holdings + đánh dấu giao dịch hoàn thành.
 *    - Body: { orderId, matchedPrice }
 */
exports.matchOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, matchedPrice } = req.body;

    // Start a transaction
    await queryMySQL("START TRANSACTION");

    // Get the order details
    const orderDetails = await queryMySQL(
      "SELECT stockSymbol, transactionType, quantity, price FROM Transactions WHERE userId = ? AND transactionId = ?",
      [userId, orderId]
    );
    if (orderDetails.length === 0) {
      await queryMySQL("ROLLBACK");
      return res.status(404).send({ error: "Order not found" });
    }

    const { stockSymbol, transactionType, quantity, price } = orderDetails[0];
    const totalCost = matchedPrice * quantity;

    // Update user's balance
    if (transactionType === "buy") {
      await queryMySQL(
        "UPDATE UserAccounts SET balance = balance - ? WHERE userId = ?",
        [totalCost, userId]
      );
    } else {
      // if sell
      await queryMySQL(
        "UPDATE UserAccounts SET balance = balance + ? WHERE userId = ?",
        [totalCost, userId]
      );
    }

    // Update Holdings
    if (transactionType === "buy") {
      await queryMySQL(
        "INSERT INTO holdings (userId, stockSymbol, quantity, purchasePrice) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?, purchasePrice = (purchasePrice * quantity + ?) / (quantity + ?)",
        [
          userId,
          stockSymbol,
          quantity,
          matchedPrice,
          quantity,
          totalCost,
          quantity,
        ]
      );
    } else {
      // if sell
      await queryMySQL(
        "UPDATE holdings SET quantity = quantity - ? WHERE userId = ? AND stockSymbol = ?",
        [quantity, userId, stockSymbol]
      );
    }

    // Update the order status to 'matched'
    await queryMySQL(
      "UPDATE Transactions SET status = 'complete', matchedQuantity = ?, averageMatchedPrice = ? WHERE transactionId = ?",
      [quantity, matchedPrice, orderId]
    );

    // Commit the transaction
    await queryMySQL("COMMIT");

    res.send({ message: "Order matched successfully" });
    s;
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET /getOrders
 *    - Lấy danh sách tất cả giao dịch (Transactions) của user hiện tại
 */
exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await queryMySQL(
      "SELECT stockSymbol, transactionType, quantity, price, matchedQuantity, averageMatchedPrice, status FROM Transactions WHERE userId = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).send({ error: "No orders found" });
    }

    res.send({ orders: result });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. DELETE /quan_tri_von
 *    - Xóa một symbol khỏi watchlist (quan_tri_von)
 *    - Body: { symbol }
 */
exports.deleteQuanTriVon = async (req, res, next) => {
  try {
    let data = req.body;
    if (!data) {
      return res
        .status(400)
        .send({ error: true, message: "Please provide data" });
    }
    await queryMySQL("DELETE FROM quan_tri_von WHERE symbol = ?", [
      data.symbol,
    ]);
    res.send({ error: false, data: data, message: "Xóa thành công" });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /signals
 *    - Lấy danh sách tín hiệu (signals) của user hiện tại và tín hiệu shared đã ACCEPTED
 */
exports.getSignals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    // Truy vấn lấy tín hiệu của người dùng và thông tin OwnerId
    const userSignals = await queryMySQL(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM signals s JOIN users u ON s.OwnerID = u.userID WHERE s.OwnerID = ?",
      [userId]
    );

    // Truy vấn lấy tín hiệu được chia sẻ với người dùng và thông tin OwnerId
    const sharedSignals = await queryMySQL(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM sharedsignals ss JOIN signals s ON ss.SignalID = s.SignalID JOIN users u ON s.OwnerID = u.userID WHERE ss.ReceiverID = ? AND ss.Status = 'ACCEPTED'",
      [userId]
    );

    // Kết hợp kết quả và loại bỏ trùng lặp
    const signalMap = new Map();
    [...userSignals, ...sharedSignals].forEach((signal) => {
      signalMap.set(signal.SignalID, signal);
    });

    // Chuyển Map thành mảng để gửi về client
    const uniqueSignals = Array.from(signalMap.values());

    res.send({ success: true, signals: uniqueSignals });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. DELETE /signals/delete/:SignalID
 *    - Xóa một signal (cả shared và owned)
 */
exports.deleteSignal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { SignalID } = req.params;
    //delete shared signals
    await queryMySQL("DELETE FROM sharedsignals WHERE SignalID = ?", [
      SignalID,
    ]);

    await queryMySQL("DELETE FROM signals WHERE SignalID = ? AND OwnerID = ?", [
      SignalID,
      userId,
    ]);
    res.send({ success: true, message: "Signal deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. POST /signals/share
 *    - Chia sẻ signal tới nhiều user
 *    - Body: { SignalID, receiverIDs: [<userId>] }
 */
exports.shareSignal = async (req, res, next) => {
  try {
    const { SignalID, receiverIDs } = req.body; // Sử dụng mảng receiverIDs
    const SenderID = req.user.userId;

    // Lấy thông tin tín hiệu
    const signal = await queryMySQL(
      "SELECT * FROM signals WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, SenderID]
    );

    // Vòng lặp qua mỗi ReceiverID và chèn vào cơ sở dữ liệu
    for (const ReceiverID of receiverIDs) {
      await queryMySQL(
        "INSERT INTO sharedsignals (SignalID, SenderID, ReceiverID) VALUES (?, ?, ?)",
        [SignalID, SenderID, ReceiverID]
      );

      const senderInfo = await queryMySQL(
        "SELECT * FROM users WHERE userID = ?",
        [SenderID]
      );

      const receiverSocketId = userSocketMap[ReceiverID];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newChart", [signal[0], senderInfo[0]]);
      }
    }

    res.send({
      success: true,
      message: "Signal shared successfully with multiple users",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /signals/list-share-request
 *    - Lấy danh sách yêu cầu chia sẻ signal (status = "PENDING") cho user hiện tại
 */
exports.listShareSignalRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sharedSignals = await queryMySQL(
      "SELECT sharedsignals.*, users.name, users.image, users.userID, users.isOnline, signals.* " +
        "FROM sharedsignals " +
        "JOIN users ON sharedsignals.SenderID = users.userID " +
        "JOIN signals ON sharedsignals.SignalID = signals.SignalID " +
        "WHERE sharedsignals.ReceiverID = ? AND sharedsignals.Status = 'PENDING'",
      [userId]
    );
    res.send({ success: true, sharedSignals });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. POST /signals/respond
 *    - Xác nhận hoặc từ chối tín hiệu được chia sẻ
 */
exports.respondSignalShare = async (req, res, next) => {
  try {
    const { SharedID, Status } = req.body; // Status can be 'ACCEPTED' or 'REJECTED'
    const ReceiverID = req.user.userId;
    await queryMySQL(
      "UPDATE sharedsignals SET Status = ?, RespondedAt = NOW() WHERE SharedID = ? AND ReceiverID = ?",
      [Status, SharedID, ReceiverID]
    );
    res.send({ success: true, message: "Response recorded successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. GET /signals/shared
 *     - Lấy danh sách user đã chia sẻ cho một SignalID
 */
exports.getSharedSignalDetails = async (req, res, next) => {
  try {
    const SignalID = req.query.SignalID;
    const sharedSignals = await queryMySQL(
      "SELECT SharedSignals.*, users.name, users.image, users.userID, users.isOnline " +
        "FROM SharedSignals " +
        "JOIN users ON SharedSignals.ReceiverID = users.userID " +
        "WHERE SharedSignals.SignalID = ?",
      [SignalID]
    );
    res.send({ success: true, sharedSignals });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. POST /signals/add
 *     - Thêm mới một signal
 */
exports.addSignal = async (req, res, next) => {
  try {
    // Giả sử các trường dữ liệu tín hiệu được gửi qua body của request
    const { signalInfo, ownerId, symbol, signalName } = req.body;
    let signalInfoStringify = JSON.stringify(signalInfo);
    // Kiểm tra dữ liệu đầu vào
    if (!signalInfo || !ownerId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing required fields" });
    }
    let creationDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    // Thêm tín hiệu vào cơ sở dữ liệu
    await queryMySQL(
      "INSERT INTO Signals (OwnerID, SignalInfo, CreatedAt, symbol, SignalName) VALUES (?, ?, ?, ?, ?)",
      [ownerId, signalInfoStringify, creationDate, symbol, signalName]
    );

    res.send({ success: true, message: "Signal added successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 12. GET /listChiTieu
 *     - Lấy danh sách listChiTieu của user hiện tại + list đã chia sẻ Accepted
 */
exports.getChiTieuLists = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Truy vấn lấy tín hiệu của người dùng và thông tin OwnerId
    const userSignals = await queryMySQL(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM listchitieu s JOIN users u ON s.OwnerID = u.userID WHERE s.OwnerID = ?",
      [userId]
    );

    // Truy vấn lấy tín hiệu được chia sẻ với người dùng và thông tin OwnerId
    const sharedSignals = await queryMySQL(
      "SELECT s.*, u.name, u.image, u.userID, u.isOnline FROM shared_listChiTieu ss JOIN listchitieu s ON ss.SignalID = s.SignalID JOIN users u ON s.OwnerID = u.userID WHERE ss.ReceiverID = ? AND ss.Status = 'ACCEPTED'",
      [userId]
    );

    // Kết hợp kết quả và loại bỏ trùng lặp
    const signalMap = new Map();
    [...userSignals, ...sharedSignals].forEach((signal) => {
      signalMap.set(signal.SignalID, signal);
    });

    // Chuyển Map thành mảng để gửi về client
    const uniqueSignals = Array.from(signalMap.values());

    res.send({ success: true, signals: uniqueSignals });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. DELETE /listChiTieu/delete/:SignalID
 *    - Xóa một custom indicator list (listChiTieu) của user hiện tại
 */
exports.deleteChiTieu = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { SignalID } = req.params;

    // Xóa các bản ghi chia sẻ tín hiệu
    await queryMySQL("DELETE FROM shared_listChiTieu WHERE SignalID = ?", [
      SignalID,
    ]);

    // Xóa tín hiệu của người dùng
    await queryMySQL(
      "DELETE FROM listchitieu WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, userId]
    );

    res.send({ success: true, message: "Signal deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. POST /listChiTieu/share
 *     - Chia sẻ custom indicator list (listChiTieu) tới nhiều user
 *     - Body: { SignalID, receiverIDs: [<userId>] }
 */
exports.shareChiTieu = async (req, res, next) => {
  try {
    const { SignalID, receiverIDs } = req.body; // Sử dụng mảng receiverIDs
    const SenderID = req.user.userId;

    // Lấy thông tin tín hiệu
    const signal = await queryMySQL(
      "SELECT * FROM listchitieu WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, SenderID]
    );

    if (signal.length === 0) {
      return res.status(404).send({ error: true, message: "Signal not found" });
    }

    // Vòng lặp qua mỗi ReceiverID và chèn vào cơ sở dữ liệu
    for (const ReceiverID of receiverIDs) {
      await queryMySQL(
        "INSERT INTO shared_listChiTieu (SignalID, SenderID, ReceiverID) VALUES (?, ?, ?)",
        [SignalID, SenderID, ReceiverID]
      );

      const senderInfo = await queryMySQL(
        "SELECT * FROM users WHERE userID = ?",
        [SenderID]
      );

      const receiverSocketId = userSocketMap[ReceiverID];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newChart", [signal[0], senderInfo[0]]);
      }
    }

    res.send({
      success: true,
      message: "Signal shared successfully with multiple users",
    });
  } catch (err) {
    next(err);
  }
};

exports.shareChiTieu = async (req, res, next) => {
  try {
    const { SignalID, receiverIDs } = req.body; // Sử dụng mảng receiverIDs
    const SenderID = req.user.userId;

    // Lấy thông tin tín hiệu
    const signal = await queryMySQL(
      "SELECT * FROM listchitieu WHERE SignalID = ? AND OwnerID = ?",
      [SignalID, SenderID]
    );

    if (signal.length === 0) {
      return res.status(404).send({ error: true, message: "Signal not found" });
    }

    // Vòng lặp qua mỗi ReceiverID và chèn vào cơ sở dữ liệu
    for (const ReceiverID of receiverIDs) {
      await queryMySQL(
        "INSERT INTO shared_listChiTieu (SignalID, SenderID, ReceiverID) VALUES (?, ?, ?)",
        [SignalID, SenderID, ReceiverID]
      );

      const senderInfo = await queryMySQL(
        "SELECT * FROM users WHERE userID = ?",
        [SenderID]
      );

      const receiverSocketId = userSocketMap[ReceiverID];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newChart", [signal[0], senderInfo[0]]);
      }
    }

    res.send({
      success: true,
      message: "Signal shared successfully with multiple users",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. GET /listChiTieu/list-share-request
 *     - Lấy danh sách yêu cầu chia sẻ listChiTieu (status = "PENDING") cho user hiện tại
 */
exports.listShareChiTieuRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sharedSignals = await queryMySQL(
      "SELECT shared_listChiTieu.*, users.name, users.image, users.userID, users.isOnline, listchitieu.* " +
        "FROM shared_listChiTieu " +
        "JOIN users ON shared_listChiTieu.SenderID = users.userID " +
        "JOIN listchitieu ON shared_listChiTieu.SignalID = listchitieu.SignalID " +
        "WHERE shared_listChiTieu.ReceiverID = ? AND shared_listChiTieu.Status = 'PENDING'",
      [userId]
    );
    res.send({ success: true, sharedSignals });
  } catch (err) {
    next(err);
  }
};
/**
 * 12. POST /listChiTieu/respond
 *     - Xác nhận hoặc từ chối tín hiệu được chia sẻ
 */
exports.respondChiTieuShare = async (req, res, next) => {
  try {
    const { SharedID, Status } = req.body; // Status can be 'ACCEPTED' or 'REJECTED'
    const ReceiverID = req.user.userId;
    await queryMySQL(
      "UPDATE shared_listChiTieu SET Status = ?, RespondedAt = NOW() WHERE SharedID = ? AND ReceiverID = ?",
      [Status, SharedID, ReceiverID]
    );
    res.send({ success: true, message: "Response recorded successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 13. GET /listChiTieu/shared
 *     - Lấy danh sách user đã chia sẻ cho một SignalID
 */
exports.getSharedChiTieuDetails = async (req, res, next) => {
  try {
    const SignalID = req.query.SignalID;
    const sharedSignals = await queryMySQL(
      "SELECT shared_listChiTieu.*, users.name, users.image, users.userID, users.isOnline " +
        "FROM shared_listChiTieu " +
        "JOIN users ON shared_listChiTieu.ReceiverID = users.userID " +
        "WHERE shared_listChiTieu.SignalID = ?",
      [SignalID]
    );
    res.send({ success: true, sharedSignals });
  } catch (err) {
    next(err);
  }
};

/**
 * 14. POST /listChiTieu/add
 *     - Thêm mới một listChiTieu
 */
exports.addChiTieu = async (req, res, next) => {
  try {
    // Giả sử các trường dữ liệu tín hiệu được gửi qua body của request
    const { signalInfo, ownerId, symbol, signalName } = req.body;
    let signalInfoStringify = JSON.stringify(signalInfo);
    // Kiểm tra dữ liệu đầu vào
    if (!signalInfo || !ownerId) {
      return res
        .status(400)
        .send({ error: true, message: "Missing required fields" });
    }
    let creationDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    // Thêm tín hiệu vào cơ sở dữ liệu
    await queryMySQL(
      "INSERT INTO listchitieu (OwnerID, SignalInfo, CreatedAt, symbol, SignalName) VALUES (?, ?, ?, ?, ?)",
      [ownerId, signalInfoStringify, creationDate, symbol, signalName]
    );

    res.send({ success: true, message: "Signal added successfully" });
  } catch (err) {
    next(err);
  }
};

exports.listShareRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const sharedSignals = await query(
      "SELECT shared_listChiTieu.*, users.name, users.image, users.userID, users.isOnline, listchitieu.* " +
        "FROM shared_listChiTieu " +
        "JOIN users ON shared_listChiTieu.SenderID = users.userID " +
        "JOIN listchitieu ON shared_listChiTieu.SignalID = listchitieu.SignalID " +
        "WHERE shared_listChiTieu.ReceiverID = ? AND shared_listChiTieu.Status = 'PENDING'",
      [userId]
    );
    res.send({ success: true, sharedSignals });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

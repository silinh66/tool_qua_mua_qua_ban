// sockets/marketSocket.js

const fs = require("fs");
const signalr = require("signalr-client");
const batchInsert = require("../utils/batchInsert");
const queryMySQL = require("../utils/queryMySQL");
const getAccessToken =
  require("../controllers/_marketAuthHelper").getAccessToken;
// CHÚ Ý: Đồng bộ đường dẫn đến bảng “mua_ban_chu_dong” và config DB của bạn
// Giả sử queryMySQL trả về [rows, fields], nên ta dùng destructuring

// =======================
// 1. Cấu hình SignalR
// =======================
const API = {
  SIGNALR: "signalr",
};

function addSlash(str) {
  return str.substr(-1) !== "/" ? str + "/" : str;
}
function resolveURL(baseURL, endpoint) {
  return addSlash(baseURL) + endpoint;
}

// Biến lưu state SignalR client và dữ liệu batch
let signalRClient = null;
let batchData = [];
const processedDataSignatures = new Set();

// =======================
// 2. Cập nhật dữ liệu iboard (nếu cần)
// =======================
let iboardData = null;
const updateIboardData = () => {
  try {
    iboardData = fs.readFileSync("iboard.json", "utf8");
  } catch (err) {
    console.error("Error reading iboard.json:", err);
    iboardData = null;
  }
};
// Khởi chạy update mỗi giây (nếu bạn vẫn muốn dùng iboardData ở đây)
setInterval(updateIboardData, 1000);

// =======================
// 2.5. Helper function to parse TradingDate + Time to Unix timestamp
// =======================
function parseTradingDateTime(tradingDate, tradingTime) {
  try {
    // tradingDate format: "YYYYMMDD" or "YYYY-MM-DD"
    // tradingTime format: "HH:mm:ss" or "HHmmss"
    let dateStr = tradingDate.toString().replace(/-/g, "");
    let timeStr = tradingTime.toString().replace(/:/g, "");

    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = timeStr.substring(0, 2);
    const minute = timeStr.substring(2, 4);
    const second = timeStr.substring(4, 6) || "00";

    const dateTimeStr = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`; // Vietnam timezone
    return Math.floor(new Date(dateTimeStr).getTime() / 1000);
  } catch (err) {
    console.error("Error parsing trading datetime:", err);
    return Math.floor(Date.now() / 1000);
  }
}

// =======================
// 3. Hàm xử lý nội dung RType="X"
// =======================
async function handleTypeX(content, ioNamespace) {
  const symbol = content.Symbol;
  const price = parseFloat(content.LastPrice) / 1000;

  // Kiểm tra trendline alerts
  try {
    const alerts = await queryMySQL(
      "SELECT * FROM trendline_alerts WHERE symbol=? AND enabled=1",
      [symbol]
    );

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        const {
          id,
          user_id,
          alert_type,
          target_price,
          a,
          b,
          last_position,
          notified,
          enabled,
          client_line_id,
        } = alert;

        let currentPos = null;
        // --- PRICE alert branch ---
        if (alert_type === "price") {
          if (target_price == null) continue; // skip invalid
          // compare current price with target_price
          if (client_line_id === "SSI_PRICE_ABOVE") {
            if (price >= Number(target_price)) {
              console.log(`Thông báo giá vượt lên giá trị ${target_price}`);
              currentPos = "above";
            }
          }
          if (client_line_id === "SSI_PRICE_BELOW") {
            if (price <= Number(target_price)) {
              console.log(`Thông báo giá vượt xuống giá trị ${target_price}`);
              currentPos = "below";
            }
          }
          // currentPos = price >= Number(target_price) ? "above" : "below";
        } else {
          // --- TRENDLINE branch (use a,b and time_t from chart) ---
          // IMPORTANT: use content.time_t if provided by upstream. Otherwise fallback server time.
          let time_t;
          if (content.time_t) {
            time_t = Number(content.time_t);
          } else if (content.TradingDate && content.Time) {
            // parse TradingDate + Time -> unix seconds (implement helper parseTradingDateTime)
            time_t = parseTradingDateTime(content.TradingDate, content.Time);
          } else {
            time_t = Math.floor(Date.now() / 1000);
          }

          const y = Number(a) * time_t + Number(b);
          currentPos = price >= y ? "above" : "below";
        }

        // if no last_position recorded -> initialize (do not trigger yet)
        if (!last_position) {
          await queryMySQL(
            "UPDATE trendline_alerts SET last_position=? WHERE id=?",
            [currentPos, id]
          );
          continue;
        }

        if (alert_type === "price" && notified === 0 && enabled === 1) {
          if (currentPos === "above" || currentPos === "below")
            ioNamespace.to(`user:${user_id}`).emit("trendlineCross", {
              type: alert_type || "price",
              symbol,
              price,
              target_price:
                alert_type === "price" ? Number(target_price) : null,
              a: alert_type === "trendline" ? Number(a) : null,
              b: alert_type === "trendline" ? Number(b) : null,
              time: new Date().toISOString(),
            });
          const updateResult = await queryMySQL(
            "UPDATE trendline_alerts SET notified=1, last_position=? WHERE id=? AND notified=0",
            [currentPos, id]
          );
        } else {
          if (last_position !== currentPos && notified === 0 && enabled === 1) {
            // atomic update: set notified=1 only when it's currently 0
            const updateResult = await queryMySQL(
              "UPDATE trendline_alerts SET notified=1, last_position=? WHERE id=? AND notified=0",
              [currentPos, id]
            );

            // mysql2 returns result.affectedRows in updateResult. If your queryMySQL wraps, adapt accordingly.
            const affected =
              updateResult &&
              (updateResult.affectedRows || updateResult.changedRows || 0);
            console.log("affected:", affected);

            if (affected > 0) {
              console.log(
                `[ALERT] ${symbol} crossed ${
                  alert_type || "trendline"
                } id=${id} user=${user_id}`
              );

              ioNamespace.to(`user:${user_id}`).emit("trendlineCross", {
                type: alert_type || "trendline",
                symbol,
                price,
                target_price:
                  alert_type === "price" ? Number(target_price) : null,
                a: alert_type === "trendline" ? Number(a) : null,
                b: alert_type === "trendline" ? Number(b) : null,
                time: new Date().toISOString(),
              });
            } else {
              // someone else handled it already - still ensure last_position saved (best-effort)
              await queryMySQL(
                "UPDATE trendline_alerts SET last_position=? WHERE id=?",
                [currentPos, id]
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error checking trendline alerts:", err);
  }

  // map nội dung giống y hệt trong marketStreaming.js gốc
  const data = {
    symbol: content.Symbol,
    TradingDate: content.TradingDate,
    Time: content.Time,
    Ceiling: content.Ceiling,
    Floor: content.Floor,
    RefPrice: content.RefPrice,
    Open: content.Open,
    High: content.High,
    Low: content.Low,
    Close: content.Close,
    AvgPrice: typeof content.AvgPrice === "number" ? content.AvgPrice : null,
    PriorVal: content.PriorVal,
    LastPrice: content.LastPrice,
    LastVol: content.LastVol,
    TotalVal: content.TotalVal,
    TotalVol: content.TotalVol,
    BidPrice1: content.BidPrice1,
    BidPrice2: content.BidPrice2,
    BidPrice3: content.BidPrice3,
    BidPrice4: content.BidPrice4,
    BidPrice5: content.BidPrice5,
    BidPrice6: content.BidPrice6,
    BidPrice7: content.BidPrice7,
    BidPrice8: content.BidPrice8,
    BidPrice9: content.BidPrice9,
    BidPrice10: content.BidPrice10,
    BidVol1: content.BidVol1,
    BidVol2: content.BidVol2,
    BidVol3: content.BidVol3,
    BidVol4: content.BidVol4,
    BidVol5: content.BidVol5,
    BidVol6: content.BidVol6,
    BidVol7: content.BidVol7,
    BidVol8: content.BidVol8,
    BidVol9: content.BidVol9,
    BidVol10: content.BidVol10,
    AskPrice1: content.AskPrice1,
    AskPrice2: content.AskPrice2,
    AskPrice3: content.AskPrice3,
    AskPrice4: content.AskPrice4,
    AskPrice5: content.AskPrice5,
    AskPrice6: content.AskPrice6,
    AskPrice7: content.AskPrice7,
    AskPrice8: content.AskPrice8,
    AskPrice9: content.AskPrice9,
    AskPrice10: content.AskPrice10,
    AskVol1: content.AskVol1,
    AskVol2: content.AskVol2,
    AskVol3: content.AskVol3,
    AskVol4: content.AskVol4,
    AskVol5: content.AskVol5,
    AskVol6: content.AskVol6,
    AskVol7: content.AskVol7,
    AskVol8: content.AskVol8,
    AskVol9: content.AskVol9,
    AskVol10: content.AskVol10,
    MarketId: content.MarketId,
    Exchange: content.Exchange,
    TradingSession: content.TradingSession,
    TradingStatus: content.TradingStatus,
    Change: content.Change,
    RatioChange:
      typeof content.RatioChange === "number" ? content.RatioChange : null,
    EstMatchedPrice: content.EstMatchedPrice,
    type:
      content.TradingSession === "ATO"
        ? "ATO"
        : content.TradingSession === "ATC"
        ? "ATC"
        : determineType(content),
  };

  // Tạo signature để tránh trùng data nếu cần
  const dataSignature = `${data.symbol}_${data.TotalVal}`;
  const isDuplicate = processedDataSignatures.has(dataSignature);

  // Gửi tới các socket.io client đã subscribe cùng symbol
  //   + namespace = ioNamespace ("/marketStream")
  //   + chúng ta lưu một Map từ socket.id → symbol mà socket đó quan tâm
  for (let [id, socket] of ioNamespace.sockets) {
    if (socket.connected) {
      const interest = ioNamespace._socketInterests.get(id);

      if (interest?.toUpperCase() === data.symbol?.toUpperCase()) {
        socket.emit("marketData", { ...data, isDuplicate });
      }
      console.log(
        "Emitted marketData to socketId=",
        socket.id,
        "symbol=",
        data.symbol,
        "isDuplicate=",
        isDuplicate
      );
    }
  }

  // Lưu data vào batch
  batchData.push(data);
  processedDataSignatures.add(dataSignature);

  // Nếu batch đủ 500 record, insert rồi reset
  if (batchData.length >= 500) {
    batchInsert("mua_ban_chu_dong", batchData);
    batchData = [];
  }
}

function determineType(content) {
  if (content?.LastPrice >= content?.AskPrice1) {
    return "B";
  } else if (content?.LastPrice <= content?.BidPrice1) {
    return "S";
  }
  return "";
}

// =======================
// 4. Khởi tạo namespace Socket.IO cho marketStream
// =======================
module.exports = async function initMarketSocket(io) {
  // Tạo namespace "/marketStream"
  const marketIo = io.of("/marketStream");

  // Map lưu interest: socket.id → symbol
  marketIo._socketInterests = new Map();

  marketIo.on("connection", (socket) => {
    console.log(`MarketStream client connected: socketId=${socket.id}`);

    // client join vào room riêng theo userId
    socket.on("joinUserRoom", ({ userId }) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room user:${userId}`);
    });

    // Client gửi sự kiện "subscribe" kèm symbol muốn theo dõi
    socket.on("subscribe", (symbol) => {
      marketIo._socketInterests.set(socket.id, symbol);
      console.log(`Socket ${socket.id} subscribed to ${symbol}`);
    });

    socket.on("unsubscribe", () => {
      marketIo._socketInterests.delete(socket.id);
      console.log(`Socket ${socket.id} unsubscribed`);
    });

    socket.on("disconnect", () => {
      marketIo._socketInterests.delete(socket.id);
      console.log(`MarketStream client disconnected: socketId=${socket.id}`);
    });
  });

  // =======================
  // 5. Khởi động SignalR client (giống initStream)
  // =======================

  const token = await getAccessToken();
  const options = {
    url: process.env.MARKET_HUB_URL, // Ví dụ: "https://market.example.com/"
    token: token, // ví dụ Bearer token
  };
  const url = resolveURL(options.url, API.SIGNALR);

  signalRClient = new signalr.client(url, ["FcMarketDataV2Hub"], 10, true);
  signalRClient.headers["Authorization"] = options.token;

  signalRClient.on("FcMarketDataV2Hub", "Broadcast", async (message) => {
    try {
      const data = JSON.parse(message);
      const content = JSON.parse(data.Content);
      if (content?.RType === "X" && content?.Symbol) {
        await handleTypeX(content, marketIo);
      }
    } catch (err) {
      console.error("Error processing SignalR Broadcast:", err);
    }
  });

  signalRClient.on("FcMarketDataV2Hub", "Reconnected", (msg) => {
    console.log("SignalR Reconnected:", msg);
  });
  signalRClient.on("FcMarketDataV2Hub", "Disconnected", (msg) => {
    console.log("SignalR Disconnected:", msg);
  });
  signalRClient.on("FcMarketDataV2Hub", "Error", (msg) => {
    console.error("SignalR Error:", msg);
  });

  // Bắt đầu streaming
  signalRClient.start();

  signalRClient.serviceHandlers = {
    connected: function () {
      console.log("[SignalR] Connected! Sending SwitchChannels...");
      signalRClient.invoke(
        "FcMarketDataV2Hub",
        "SwitchChannels",
        "X-QUOTE:ALL,X:ALL,B:ALL"
      );
    },
    disconnected: function () {
      console.log("[SignalR] Disconnected!");
    },
    reconnecting: function () {
      console.log("[SignalR] Reconnecting...");
      signalRClient.invoke(
        "FcMarketDataV2Hub",
        "SwitchChannels",
        "X-QUOTE:ALL,X:ALL,B:ALL"
      );
    },
    onerror: function (err) {
      console.error("[SignalR] Error:", err);
    },
  };
};

// index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const app = express();
require("dotenv").config();
// const { startCronJobs } = require("./cronJob");

// ==== CORS configuration ====
const allowedOrigins = [
  "http://localhost:80",
  "http://dautubenvung.duckdns.org",
  "http://localhost:3001",
  "https://app.dautubenvung.vn",
  "http://10.254.58.16:8081",
  "http://localhost:7000",
  "http://localhost:5173",
  "*",
];
app.use(
  cors({
    origin(origin, callback) {
      // allow requests with no origin (mobile apps, curl etc)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Custom-Header", // ← thêm header tùy chỉnh ở đây
    ],
    credentials: true,
  })
);

// Always respond to preflight requests
app.options("*", cors());

app.use(express.json());

// --- Các route đã mount sẵn ---
const dataFeedRoutes = require("./routes/dataFeed");
app.use("/", dataFeedRoutes);

// const marketRoutes = require("./routes/market");
// app.use("/market", marketRoutes);

// app.use("/", require("./routes/topics"));
// app.use("/", require("./routes/info"));
// app.use("/", require("./routes/social"));
// app.use("/", require("./routes/postInteraction"));
// app.use("/", require("./routes/forum"));
// app.use("/", require("./routes/community"));
// app.use("/", require("./routes/message")); // Chat API (REST)
// app.use("/", require("./routes/groups"));
// app.use("/", require("./routes/conversations"));
// app.use("/", require("./routes/marketMisc"));
// app.use("/", require("./routes/accountAndConfig"));
// app.use("/", require("./routes/settingsAndIboard"));
// app.use("/", require("./routes/marketData"));
// app.use("/", require("./routes/commodityAndCompany"));
// app.use("/", require("./routes/otherData"));
// app.use("/", require("./routes/companyDetails"));
// app.use("/", require("./routes/miscData"));
// app.use("/", require("./routes/auth"));
// app.use("/", require("./routes/tradingAndShare"));
// app.use("/api/alerts/trendline", require("./routes/trendlineAlert"));

// Middleware xử lý lỗi (nếu có)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// --- Tạo HTTP server từ Express ---
const server = http.createServer(app);

// --- Khởi tạo Socket.io dựa trên cùng server đó ---
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    transports: ["websocket"],
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Import hai module socket và truyền "io" vào
// const initChatSocket = require("./sockets/chatSocket");
// const initHomeSocket = require("./sockets/homeSocket");
// const initMarketSocket = require("./sockets/marketSocket");
// initChatSocket(io);
// initHomeSocket(io);
// initMarketSocket(io);

// --- Khởi động HTTP server (REST + WebSocket) ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Chat namespace available at ws://localhost:${PORT}/chat`);
  console.log(`Home namespace available at ws://localhost:${PORT}/home`);
  console.log(`MarketStream namespace: ws://localhost:${PORT}/marketStream`);
});

// startCronJobs(); // Khởi động các cron job đã định nghĩa

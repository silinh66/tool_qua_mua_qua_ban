# SSI Backend

## Mô tả
Đây là skeleton project backend cho hệ thống quản lý giao dịch chứng khoán, vàng, hàng hoá, ...  
Sử dụng:  
- Node.js + Express  
- MySQL (mysql2/promise)  
- Cronjobs (node-cron)  
- Socket.IO (realtime data)

## Cấu trúc thư mục
\`\`\`
ssi-backend/
├── config/              # Cấu hình database, các biến môi trường
├── controllers/         # Xử lý request/response (gọi service)
├── services/            # Business logic (gọi model)
├── models/              # Các query hoặc định nghĩa ORM
├── middlewares/         # Middleware (auth, error handler, v.v.)
├── cronjobs/            # Các job định kỳ (thu thập dữ liệu)
├── sockets/             # Socket.IO handlers (realtime)
├── routes/              # Định nghĩa API endpoints
├── utils/               # Helper functions dùng chung
├── index.js             # Entry point của server
├── package.json         
├── .env                 # Biến môi trường (chưa commit)
└── README.md
\`\`\`

## Cài đặt & Chạy
1. Cài dependencies:  
   \`\`\`bash
   npm install
   \`\`\`
2. Copy file \`.env\` (hoặc sửa lại biến môi trường)  
3. Khởi động dev:  
   \`\`\`bash
   npm run dev
   \`\`\`
   Hoặc chạy production:  
   \`\`\`bash
   npm start
   \`\`\`
4. Thư mục \`cronjobs/\` sẽ tự động được load và lên lịch.  
5. \`Socket.IO\` được attach vào server, có namespace \`/stocks\`, \`/chat\` (stub mẫu).

## Tiếp theo
- Xây dựng chi tiết từng controller → service → model theo yêu cầu nghiệp vụ.  
- Điều chỉnh cronjob để lấy data thực tế từ API bên thứ 3.  
- Bổ sung middleware xác thực, logging, validation (Joi, celebrate, v.v.) nếu cần.  
- Viết migration (Knex/Sequelize) cho DB nếu muốn quản lý schema chặt chẽ.

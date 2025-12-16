// middlewares/checkS3Connection.js
const AWS = require("aws-sdk");

module.exports = (req, res, next) => {
  // Kiểm tra xem AWS S3 đã cấu hình key/secret/region chưa
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION
  ) {
    return res.status(500).json({ error: "S3 is not configured properly." });
  }
  next();
};

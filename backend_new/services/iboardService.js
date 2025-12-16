// services/iboardService.js
const fs = require("fs");
let iboardData = null;

function loadIboardFile() {
  try {
    iboardData = fs.readFileSync("iboard.json", "utf8");
  } catch (err) {
    console.error("Error reading iboard.json:", err);
    iboardData = null;
  }
}

// Ban đầu load một lần
loadIboardFile();
// Cứ mỗi giây cập nhật lại
setInterval(loadIboardFile, 1000);

function getIboardData() {
  if (!iboardData) return null;
  try {
    return JSON.parse(iboardData);
  } catch {
    return null;
  }
}

module.exports = { getIboardData };

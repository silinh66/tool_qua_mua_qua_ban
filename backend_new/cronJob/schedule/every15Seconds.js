// schedule/every15Seconds.js
const cron = require("node-cron");
const {
  getIndexPointHOSE,
  getIndexPointHNX,
  getNuocNgoai,
  getTuDoanhRong,
  getNuocNgoaiMuaRong,
  getChangeCount,
  getGiaVangNew,
  fetchThanhKhoanData,
} = require("../tasks/fifteenSecondTasks");

module.exports = () => {
  cron.schedule("*/15 * * * * *", async () => {
    try {
      // Get current time in Vietnam (UTC+7)
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const day = vietnamTime.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hours = vietnamTime.getUTCHours();
      const minutes = vietnamTime.getUTCMinutes();
      
      // Check if it's a weekday (Monday to Friday)
      const isWeekday = day >= 1 && day <= 5;
      
      // Check if it's within trading hours (9:00 AM to 2:45 PM)
      const isWithinTradingHours = isWeekday && 
        ((hours === 9 && minutes >= 0) ||  // 9:00 AM or later
         (hours > 9 && hours < 14) ||      // Between 10 AM and 2 PM
         (hours === 14 && minutes <= 45)); // Until 2:45 PM
      
      // Only execute during trading hours on weekdays
      if (isWithinTradingHours) {
        await getIndexPointHOSE();
        await getIndexPointHNX();
        await getNuocNgoai();
        await getTuDoanhRong();
        await getNuocNgoaiMuaRong();
        await getChangeCount();
        await getGiaVangNew();

        await fetchThanhKhoanData("hose");
        await fetchThanhKhoanData("hnx");
        await fetchThanhKhoanData("hose", true);
        await fetchThanhKhoanData("hnx", true);

        console.log("[15s] All tasks executed at", vietnamTime.toISOString());
      }
    } catch (error) {
      console.error("[15s] Error:", error);
    }
  });
};
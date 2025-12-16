// schedule/every15Minutes.js
const cron = require("node-cron");
const {
  getGiaVangNew,
  getGiaXangDau,
  getTyGiaNgoaiTe,
  updateCorrectPriceStockOverview,
  getGiaVangChogiaForCompanies,
} = require("../tasks/fifteenMinuteTasks");

module.exports = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await getGiaVangNew();
      await getGiaXangDau();
      await getTyGiaNgoaiTe();
      await getGiaVangChogiaForCompanies();
      // Check if it's weekday and within allowed hours (14:45-08:45 next day, Vietnam time)
      const now = new Date();
      const vietnamTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
      );
      const day = vietnamTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hours = vietnamTime.getHours();
      const minutes = vietnamTime.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;

      // Allowed hours: after 14:45 (885 minutes) OR before 08:45 (525 minutes)
      // Exclude Saturday (6) and Sunday (0)
      const isWeekday = day >= 1 && day <= 5;
      const isAfterMarketClose = currentTimeInMinutes >= 885; // After 14:45
      const isBeforeMarketOpen = currentTimeInMinutes <= 525; // Before 08:45

      if (isWeekday && (isAfterMarketClose || isBeforeMarketOpen)) {
        await updateCorrectPriceStockOverview();
      }

      console.log("[15m] Market data fetched");
    } catch (error) {
      console.error("[15m] Error:", error);
    }
  });
};

updateCorrectPriceStockOverview();
getGiaVangChogiaForCompanies();

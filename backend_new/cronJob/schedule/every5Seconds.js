// schedule/every5Seconds.js
const cron = require("node-cron");
const {
  fetchStockOverview,
  getIboard,
  getIndexesOverview,
} = require("../tasks/fiveSecondTask");

module.exports = () => {
  cron.schedule("*/5 * * * * *", async () => {
    try {
      // Check if it's weekday (Monday-Friday) and within trading hours (9:00-14:45 Vietnam time)
      const now = new Date();
      const vietnamTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
      );
      const day = vietnamTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hours = vietnamTime.getHours();
      const minutes = vietnamTime.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;

      // Trading hours: 9:00 (540 minutes) to 14:45 (885 minutes)
      const isWeekday = day >= 1 && day <= 5;
      const isTradingHours =
        currentTimeInMinutes >= 540 && currentTimeInMinutes <= 885;

      if (isWeekday && isTradingHours) {
        await fetchStockOverview();
      }

      // await getIboard();
      await getIndexesOverview();
      console.log("[5s] Tasks executed");
    } catch (error) {
      console.error("[5s] Error executing tasks:", error);
    }
  });
};

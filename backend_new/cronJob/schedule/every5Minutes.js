// schedule/every5Minutes.js
const cron = require("node-cron");
const { getNewsAll, getNewsAllDetail } = require("../tasks/fiveMinuteTasks");

module.exports = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      await getNewsAll();
      await getNewsAllDetail();
      console.log("[5m] News tasks executed");
    } catch (error) {
      console.error("[5m] Error:", error);
    }
  });
};

// schedule/daily.js
const cron = require("node-cron");
const { getNewsDaily, getLaiSuatDaily } = require("../tasks/dailyTasks");

module.exports = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      await getNewsDaily();
      await getLaiSuatDaily();
      console.log("[1D] Daily tasks executed");
    } catch (error) {
      console.error("[1D] Error:", error);
    }
  });
};

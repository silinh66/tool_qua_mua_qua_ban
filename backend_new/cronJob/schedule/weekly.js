// schedule/weekly.js
const cron = require("node-cron");
const { truncateTable } = require("../tasks/weeklyTasks");

module.exports = () => {
  cron.schedule("0 9 * * 1-5", async () => {
    try {
      await truncateTable();
      console.log("[1W] Table truncated");
    } catch (error) {
      console.error("[1W] Error:", error);
    }
  });
};

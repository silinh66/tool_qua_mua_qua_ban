// cronJob/index.js
const every5Seconds = require("./schedule/every5Seconds");
const every15Seconds = require("./schedule/every15Seconds");
const every5Minutes = require("./schedule/every5Minutes");
const every15Minutes = require("./schedule/every15Minutes");
const daily = require("./schedule/daily");
const weekly = require("./schedule/weekly");

// Start all scheduled jobs
// console.log("Starting scheduled cron jobs...");
// every5Seconds();
// every15Seconds();
// every5Minutes();
// every15Minutes();
// daily();
// weekly();

const startCronJobs = () => {
  console.log("Starting scheduled cron jobs...");
  // every5Seconds();
  // every15Seconds();
  // every5Minutes();
  // every15Minutes();
  // daily();
  // weekly();
};
module.exports = {
  startCronJobs,
};

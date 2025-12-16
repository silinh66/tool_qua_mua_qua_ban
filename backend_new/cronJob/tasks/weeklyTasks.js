// tasks/weeklyTasks.js

const queryMySQL = require("../../utils/queryMySQL");

async function truncateTable() {
  const queryCommand = "TRUNCATE TABLE mua_ban_chu_dong";
  try {
    await queryMySQL(queryCommand);
    console.log(
      "[truncateTable] Table 'mua_ban_chu_dong' truncated successfully"
    );
  } catch (error) {
    console.error("[truncateTable] Error truncating table:", error);
  }
}

module.exports = {
  truncateTable,
};

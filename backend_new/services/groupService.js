// services/groupService.js
const queryMySQL = require("../utils/queryMySQL");

async function getUserGroups(userId) {
  const rows = await queryMySQL(
    "SELECT group_id FROM group_members WHERE user_id = ?",
    [userId]
  );
  return rows.map((r) => r.group_id);
}

module.exports = { getUserGroups };

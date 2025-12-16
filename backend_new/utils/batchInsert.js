const queryMySQL = require("../utils/queryMySQL");

async function batchInsert(tableName, data) {
  if (data.length === 0) {
    return;
  }

  const keys = Object.keys(data[0]);
  const values = data.map((obj) => keys.map((key) => obj[key]));

  // Escape the keys with backticks
  const escapedKeys = keys.map((key) => `\`${key}\``);

  const placeholders = values
    .map((val) => "(" + new Array(val.length).fill("?").join(", ") + ")")
    .join(", ");

  const queryStr = `INSERT INTO ${tableName} (${escapedKeys.join(
    ", "
  )}) VALUES ${placeholders}`;

  try {
    let result = await queryMySQL(queryStr, values.flat());
    return result[0];
  } catch (error) {
    console.error("Database insertion error:", error);
  }
}

module.exports = batchInsert;

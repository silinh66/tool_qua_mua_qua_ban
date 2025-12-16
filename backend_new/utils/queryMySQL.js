const pool = require("../config/db");

async function queryMySQL(query, params = []) {
  try {
    let result = await pool.query(
      query,
      params,
      function (error, results, fields) {
        if (error) throw error;
      }
    );
    return result[0];
  } catch (error) {
    console.log("error: ", error);
  }
}

module.exports = queryMySQL;

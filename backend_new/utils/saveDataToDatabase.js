const queryMySQL = require("./queryMySQL");

const saveDataToDatabase = async (data, type, historical) => {
  const date_type = historical ? "historical" : "current";
  let dataMap = data?.map((item) => {
    return [type, ...Object.values(item), date_type];
  });
  const sql = `
        INSERT INTO thanh_khoan_data (type,  accumulatedVal,tradingDate_Time, date_type)
        VALUES ?
       
      `;
  await queryMySQL(
    "DELETE FROM thanh_khoan_data WHERE type = ? AND date_type = ?",
    [type, date_type]
  );
  await queryMySQL(sql, [dataMap]);
};

module.exports = saveDataToDatabase;

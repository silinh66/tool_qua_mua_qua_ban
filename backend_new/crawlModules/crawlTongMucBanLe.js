// crawlTongMucBanLe.js

const XLSX = require("xlsx");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

const crawlTongMucBanLe = async (month = 1, year = 2025) => {
  // chuyển đổi tháng/năm và xác định tên file
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const timeMonth = getListMonthMap(year)[month - 1];

  // đọc workbook và lọc sheet liên quan đến "Tongmuc"
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);
  const sheetNames = workbook.SheetNames.filter((name) =>
    name.toLowerCase().includes("tongmuc")
  );

  // định nghĩa cột và tiêu đề
  const listColumns = [
    "time",
    "tong_ban_le_hh_va_dv",
    "ban_le_hang_hoa",
    "ban_le_dich_vu_luu_tru_an_uong",
    "ban_le_du_lich_lu_hanh",
    "ban_le_dich_vu_khac",
  ];
  const listTitle = [
    "TỔNG SỐ",
    "Bán lẻ hàng hóa",
    "Dịch vụ lưu trú, ăn uống",
    "Du lịch lữ hành",
    "Dịch vụ khác",
  ];

  // thu thập dữ liệu
  const data = [];
  sheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    });
    rows.forEach((row) => {
      // chuyển đổi cell thành string an toàn
      const cell0 = row[0] != null ? String(row[0]).trim() : "";
      const cell1 = row[1] != null ? String(row[1]).trim() : "";
      const titleFound = listTitle.find(
        (t) => (cell0 && t.includes(cell0)) || (cell1 && t.includes(cell1))
      );
      if (titleFound) {
        // cột D (index 3) chứa giá trị ước tính
        let value;
        if (month === 1) value = row[3];
        else value = row[2];
        data.push(value);
      }
    });
  });

  if (data.length !== listTitle.length) {
    console.warn(
      `[crawlTongMucBanLe] Warning: expected ${listTitle.length} values but got ${data.length}`
    );
  }

  // chèn dữ liệu vào database
  await queryMySQL(
    `INSERT INTO tong_muc_ban_le_dich_vu (${listColumns.join(
      ", "
    )}) VALUES (?)`,
    [[timeMonth, ...data]]
  );

  console.log(
    `[crawlTongMucBanLe] Saved retail & service data for month ${month} year ${year}.`
  );
};

module.exports = crawlTongMucBanLe;

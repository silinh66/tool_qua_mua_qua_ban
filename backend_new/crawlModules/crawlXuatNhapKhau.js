const XLSX = require("xlsx");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

/**
 * Crawl Xuất nhập khẩu data (export and import) from monthly Excel reports
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year (e.g., 2025)
 */
const crawlXuatNhapKhau = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileName = `${year}-${curMonth}.xlsx`;
  const timeMonth = getListMonthMap(year)[month - 1];
  const workbook = XLSX.readFile(`./file_data/${fileName}`);

  const listTitle = [
    "TỔNG TRỊ GIÁ",
    "Khu vực kinh tế trong nước",
    "Khu vực có vốn đầu tư NN",
  ];

  // ---- Parse Export (XK) ----
  const sheetXK = workbook.SheetNames.find(
    (n) => n.includes("XK tháng") || n.includes("XK")
  );
  if (!sheetXK) {
    console.warn(
      `[crawlXuatNhapKhau] Không tìm thấy sheet XK tháng trong ${fileName}`
    );
    return;
  }
  const rowsXK = XLSX.utils.sheet_to_json(workbook.Sheets[sheetXK], {
    header: 1,
    blankrows: false,
  });
  const dataXK = [];
  rowsXK.forEach((row) => {
    const a = String(row[0] || "").trim();
    const b = String(row[1] || "").trim();
    const titleFound = listTitle.find((t) => a.includes(t) || b.includes(t));
    if (titleFound) dataXK.push(row[3]);
  });
  if (dataXK.length !== listTitle.length) {
    console.warn(
      `[crawlXuatNhapKhau] Dòng XK mong đợi ${listTitle.length}, thực tế ${dataXK.length}`
    );
  }
  // Insert export data
  await queryMySQL(
    `INSERT INTO xuat_nhap_khau (XK_tong, XK_khu_vuc_trong_nuoc, XK_khu_vuc_trong_FDI, time) VALUES (?)`,
    [[...dataXK, timeMonth]]
  );

  // ---- Parse Import (NK) ----
  const sheetNK = workbook.SheetNames.find(
    (n) => n.includes("NK tháng") || n.includes("NK")
  );
  if (!sheetNK) {
    console.warn(
      `[crawlXuatNhapKhau] Không tìm thấy sheet NK tháng trong ${fileName}`
    );
    return;
  }
  const rowsNK = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNK], {
    header: 1,
    blankrows: false,
  });
  const dataNK = [];
  rowsNK.forEach((row) => {
    const a = String(row[0] || "").trim();
    const b = String(row[1] || "").trim();
    const titleFound = listTitle.find((t) => a.includes(t) || b.includes(t));
    if (titleFound) dataNK.push(row[3]);
  });
  if (dataNK.length !== listTitle.length) {
    console.warn(
      `[crawlXuatNhapKhau] Dòng NK mong đợi ${listTitle.length}, thực tế ${dataNK.length}`
    );
  }
  // Update import data
  await queryMySQL(
    `UPDATE xuat_nhap_khau
     SET NK_tong = ?, NK_khu_vuc_trong_nuoc = ?, NK_khu_vuc_trong_FDI = ?
     WHERE time = ?`,
    [...dataNK, timeMonth]
  );

  console.log(
    `[crawlXuatNhapKhau] Đã lưu dữ liệu XK & NK tháng ${month} năm ${year}`
  );
};

module.exports = crawlXuatNhapKhau;

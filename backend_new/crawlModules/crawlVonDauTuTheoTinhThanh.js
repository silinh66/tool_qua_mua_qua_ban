const XLSX = require("xlsx");
const { convertMonthNumberToString } = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

// Chuyển tên tỉnh thành mã không dấu
function convertProvinceNameToUnsignCode(provinceName) {
  const charMap = {
    à: "a",
    á: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    đ: "d",
    è: "e",
    é: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    ì: "i",
    í: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ò: "o",
    ó: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ù: "u",
    ú: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ỳ: "y",
    ý: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
  };
  return provinceName
    .toLowerCase()
    .split("")
    .map((c) => charMap[c] || c)
    .join("")
    .replace(/[\s.-]+/g, "_");
}

/**
 * Crawl vốn đầu tư theo tỉnh/thành
 * @param {number} month Tháng (1-12)
 * @param {number} year Năm (ví dụ: 2025)
 */
const crawlVonDauTuTheoTinhThanh = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const time = `${year}_${curMonth}`;

  // Đọc file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);
  // Lọc sheet chứa dữ liệu VĐT NSNN theo tỉnh
  const sheetNames = workbook.SheetNames.filter(
    (name) =>
      (name.includes("VDT") ||
        name.includes("VĐT") ||
        name.includes("VDTNSNN") ||
        name.includes("VNSNN")) &&
      !name.includes("TTNSNN") &&
      !name.includes("TXH") &&
      !name.includes("VDTtXH")
  );
  if (!sheetNames.length) {
    console.log(
      `[crawlVonDauTuTheoTinhThanh] Không tìm thấy sheet cho tháng ${month}/${year}`
    );
    return;
  }
  const sheet = workbook.Sheets[sheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  // Xác định vị trí dòng dữ liệu bắt đầu tùy theo tháng
  const startRow = month === 1 ? 23 : month === 12 ? 27 : 24;
  const dataFinal = rows.slice(startRow).map((row, idx) => {
    const thanhPho = row[1];
    const vonDauTu = month === 1 || month === 12 ? row[3] : row[4];
    return [
      idx + 1,
      thanhPho,
      convertProvinceNameToUnsignCode(thanhPho),
      vonDauTu,
      time,
    ];
  });

  if (!dataFinal.length) {
    console.log(
      `[crawlVonDauTuTheoTinhThanh] Không có dữ liệu để chèn cho ${time}`
    );
    return;
  }

  // Xóa dữ liệu cũ và chèn dữ liệu mới
  await queryMySQL(`DELETE FROM von_dau_tu WHERE time = ?`, [time]);
  await queryMySQL(
    `INSERT INTO von_dau_tu (stt, thanhPho, code, vonDauTu, time) VALUES ?`,
    [dataFinal]
  );

  console.log(
    `[crawlVonDauTuTheoTinhThanh] Đã lưu dữ liệu vốn đầu tư theo tỉnh tháng ${month} năm ${year}`
  );
};

module.exports = crawlVonDauTuTheoTinhThanh;

const XLSX = require("xlsx");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

const crawlCPI = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const timeMonth = getListMonthMap(year)[month - 1];

  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);
  const sheetNames = workbook.SheetNames.filter((name) => name.includes("CPI"));

  const listColumns = [
    "time",
    "CPI",
    "CPI_hang_an_va_dich_vu_an_uong",
    "CPI_luong_thuc",
    "CPI_thuc_pham",
    "CPI_an_uong_ngoai_gia_dinh",
    "CPI_do_uong_va_thuoc_la",
    "CPI_may_mac_mu_non_giay_dep",
    "CPI_nha_o_va_vat_lieu_xay_dung",
    "CPI_thiet_bi_va_do_dung_gia_dinh",
    "CPI_thuoc_va_dich_vu_y_te",
    "CPI_dich_vu_y_te",
    "CPI_giao_thong",
    "CPI_buu_chinh_vien_thong",
    "CPI_giao_duc",
    "CPI_dich_vu_giao_duc",
    "CPI_hang_hoa_va_dich_vu_khac",
    "CPI_van_hoa_giai_tri_va_du_lich",
  ];

  const listTitle = [
    "CHỈ SỐ GIÁ TIÊU DÙNG",
    "Hàng ăn và dịch vụ ăn uống",
    "Lương thực",
    "Thực phẩm",
    "Ăn uống ngoài gia đình",
    "Đồ uống và thuốc lá",
    "May mặc, mũ nón và giày dép",
    "May mặc, giày dép và mũ nón",
    "Nhà ở và vật liệu xây dựng",
    "Nhà ở và vật liệu xây dựng(*)",
    "Thiết bị và đồ dùng gia đình",
    "Thuốc và dịch vụ y tế",
    "Dịch vụ y tế",
    "Giao thông",
    "Bưu chính viễn thông",
    "Giáo dục",
    "Dịch vụ giáo dục",
    "Văn hoá, giải trí và du lịch",
    "Hàng hóa và dịch vụ khác",
    "Đồ dùng và dịch vụ khác",
  ];

  const values = [];
  sheetNames.forEach((sheet) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
      header: 1,
      blankrows: false,
    });

    rows.forEach((row) => {
      const c0 = row[0] != null ? String(row[0]).trim() : "";
      const c1 = row[1] != null ? String(row[1]).trim() : "";
      const c2 = row[2] != null ? String(row[2]).trim() : "";

      const titleFound = listTitle.find(
        (t) =>
          (c0 !== "" && t.includes(c0)) ||
          (c1 !== "" && t.includes(c1)) ||
          (c2 !== "" && t.includes(c2))
      );

      if (titleFound) {
        let value;
        if (month === 12) value = row[6];
        else if (month === 3) value = row[3];
        else value = row[4];
        values.push(value);
      }
    });
  });

  if (values.length !== listColumns.length - 1) {
    console.warn(
      `[crawlCPI] Expected ${listColumns.length - 1} values but got ${
        values.length
      }`
    );
  }

  await queryMySQL(`INSERT INTO cpi (${listColumns.join(",")}) VALUES (?)`, [
    [timeMonth, ...values],
  ]);
  console.log(`[crawlCPI] Lưu CPI tháng ${month}/${year} thành công.`);
};

module.exports = crawlCPI;

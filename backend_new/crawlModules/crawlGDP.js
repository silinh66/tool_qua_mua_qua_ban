const XLSX = require("xlsx");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

// Crawl GDP theo giá hiện hành (GDP danh nghĩa)
const crawlGDPHienHanh = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const timeLabel = getListMonthMap(year)[month - 1];

  // Tiêu đề và cột CSDL
  const listTitle = [
    "TỔNG SỐ",
    "Nông, lâm nghiệp và thủy sản",
    "Nông nghiệp",
    "Lâm nghiệp",
    "Thủy sản",
    "Công nghiệp và xây dựng",
    "Công nghiệp",
    "Khai khoáng",
    "Công nghiệp chế biến, chế tạo",
    "Sản xuất và phân phối điện",
    "Cung cấp nước",
    "Xây dựng",
    "Dịch vụ",
    "Bán buôn và bán lẻ; sửa chữa ô tô",
    "Vận tải, kho bãi",
    "Dịch vụ lưu trú và ăn uống",
    "Thông tin và truyền thông",
    "Hoạt động tài chính, ngân hàng và bảo hiểm",
    "Hoạt động kinh doanh bất động sản",
    "Hoạt động chuyên môn, khoa học và công nghệ",
    "Hoạt động hành chính và dịch vụ hỗ trợ",
    "Hoạt động của Đảng Cộng sản, tổ chức",
    "Giáo dục và đào tạo",
    "Y tế và hoạt động trợ giúp xã hội",
    "Nghệ thuật, vui chơi và giải trí",
    "Hoạt động dịch vụ khác",
    "Hoạt động làm thuê các công việc",
    "Thuế sản phẩm trừ trợ cấp sản phẩm",
  ];
  const listColumns = [
    "gdp_theo_gia_hien_hanh",
    "gdp_hh_nong_nghiep_lam_nghiep_va_thuy_san",
    "gdp_hh_nong_nghiep",
    "gdp_hh_lam_nghiep",
    "gdp_hh_thuy_san",
    "gdp_hh_cong_nghiep_va_xay_dung",
    "gdp_hh_cong_nghiep",
    "gdp_hh_khai_khoang",
    "gdp_hh_cong_nghiep_che_bien_che_tao",
    "gdp_hh_san_xuat_va_phan_phoi_dien",
    "gdp_hh_cung_cap_nuoc_va_xu_ly_nuoc_thai",
    "gdp_hh_xay_dung",
    "gdp_hh_dich_vu",
    "gdp_hh_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may",
    "gdp_hh_van_tai_kho_bai",
    "gdp_hh_dich_vu_luu_tru_va_an_uong",
    "gdp_hh_thong_tin_va_truyen_thong",
    "gdp_hh_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem",
    "gdp_hh_hoat_dong_kinh_doanh_bat_dong_san",
    "gdp_hh_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe",
    "gdp_hh_hoat_dong_hanh_chinh_va_dich_vu_ho_tro",
    "gdp_hh_hoat_dong_cua_cac_to_chuc_chinh_tri",
    "gdp_hh_giao_duc_va_dao_tao",
    "gdp_hh_y_te_va_hoat_dong_cuu_tro_xa_hoi",
    "gdp_hh_nghe_thuat_vui_choi_va_giai_tri",
    "gdp_hh_hoat_dong_dich_vu_khac",
    "gdp_hh_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh",
    "gdp_hh_thue_san_pham_tru_tro_cap_san_pham",
    "time",
  ];

  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Xác định sheet và cột giá trị tùy theo quý I (tháng 3) hay các quý khác
  let sheetNames;
  let valueIndex = 3;

  if (month === 3) {
    const sheetName = workbook.SheetNames.find((name) => name.includes("GDP"));
    sheetNames = sheetName ? [sheetName] : [];
    valueIndex = 2; // Cột C
  } else {
    sheetNames = workbook.SheetNames.filter(
      (name) => name.includes("GDP HH") || name.includes("GDP-HH")
    );
  }

  const values = [];
  sheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    });
    rows.forEach((row) => {
      const title = (row[0] || row[1] || "").toString().trim();
      if (
        listTitle.includes(title) ||
        listTitle.some((item) => title.includes(item))
      ) {
        values.push(row[valueIndex]);
      }
    });
  });

  // Cập nhật nếu đã tồn tại
  await queryMySQL(
    `UPDATE gdp_danh_nghia SET ${listColumns
      .slice(0, -1)
      .map((col) => `${col} = ?`)
      .join(", ")} WHERE time = ?`,
    [...values, timeLabel]
  );

  // Chèn mới
  await queryMySQL(
    `INSERT INTO gdp_danh_nghia (${listColumns.join(",")}) VALUES (?)`,
    [[...values, timeLabel]]
  );

  console.log(`[crawlGDPHienHanh] Lưu GDP HH tháng ${month}/${year}`);
};

// Crawl GDP so sánh theo thực (GDP thực)
const crawlGDPThuc = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const timeLabel = getListMonthMap(year)[month - 1];

  const listTitle = [
    "TỔNG SỐ",
    "Nông, lâm nghiệp và thủy sản",
    "Nông nghiệp",
    "Lâm nghiệp",
    "Thủy sản",
    "Công nghiệp và xây dựng",
    "Công nghiệp",
    "Khai khoáng",
    "Công nghiệp chế biến, chế tạo",
    "Sản xuất và phân phối điện",
    "Cung cấp nước",
    "Xây dựng",
    "Dịch vụ",
    "Bán buôn và bán lẻ; sửa chữa ô tô",
    "Vận tải, kho bãi",
    "Dịch vụ lưu trú và ăn uống",
    "Thông tin và truyền thông",
    "Hoạt động tài chính, ngân hàng và bảo hiểm",
    "Hoạt động kinh doanh bất động sản",
    "Hoạt động chuyên môn",
    "Hoạt động hành chính và dịch vụ hỗ trợ",
    "Hoạt động của Đảng Cộng sản, tổ chức",
    "Giáo dục và đào tạo",
    "Y tế và hoạt động trợ giúp xã hội",
    "Nghệ thuật, vui chơi và giải trí",
    "Hoạt động dịch vụ khác",
    "Hoạt động làm thuê các công việc",
    "Thuế sản phẩm trừ trợ cấp sản phẩm",
  ];
  const listColumns = [
    "gdp_so_sanh",
    "gdp_nong_nghiep_lam_nghiep_va_thuy_san",
    "gdp_nong_nghiep",
    "gdp_lam_nghiep",
    "gdp_thuy_san",
    "gdp_cong_nghiep_va_xay_dung",
    "gdp_cong_nghiep",
    "gdp_khai_khoang",
    "gdp_cong_nghiep_che_bien_che_tao",
    "gdp_san_xuat_va_phan_phoi_dien",
    "gdp_cung_cap_nuoc_va_xu_ly_nuoc_thai",
    "gdp_xay_dung",
    "gdp_dich_vu",
    "gdp_ban_buon_ban_le_sua_chua_o_to_mo_to_xe_may",
    "gdp_van_tai_kho_bai",
    "gdp_dich_vu_luu_tru_va_an_uong",
    "gdp_thong_tin_va_truyen_thong",
    "gdp_hoat_dong_tai_chinh_ngan_hang_va_bao_hiem",
    "gdp_hoat_dong_kinh_doanh_bat_dong_san",
    "gdp_hoat_dong_chuyen_mon_khoa_hoc_va_cong_nghe",
    "gdp_hoat_dong_hanh_chinh_va_dich_vu_ho_tro",
    "gdp_hoat_dong_cua_cac_to_chuc_chinh_tri",
    "gdp_giao_duc_va_dao_tao",
    "gdp_y_te_va_hoat_dong_cuu_tro_xa_hoi",
    "gdp_nghe_thuat_vui_choi_va_giai_tri",
    "gdp_hoat_dong_dich_vu_khac",
    "gdp_hoat_dong_lam_thue_cac_cong_viec_trong_cac_ho_gia_dinh",
    "gdp_thue_san_pham_tru_tro_cap_san_pham",
    "time",
  ];

  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  let sheetNames;
  let valueIndex = 3;

  if (month === 3) {
    const sheetName = workbook.SheetNames.find((name) => name.includes("GDP"));
    sheetNames = sheetName ? [sheetName] : [];
    valueIndex = 5; // Cột F
  } else {
    sheetNames = workbook.SheetNames.filter(
      (name) => name.includes("GDP SS") || name.includes("GDP-SS")
    );
  }

  const values = [];
  sheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    });
    rows.forEach((row) => {
      const title = (row[0] || row[1] || "").toString().trim();
      if (
        listTitle.includes(title) ||
        listTitle.some((item) => title.includes(item))
      ) {
        values.push(row[valueIndex]);
      }
    });
  });

  await queryMySQL(
    `UPDATE gdp_thuc SET ${listColumns
      .slice(0, -1)
      .map((col) => `${col} = ?`)
      .join(", ")} WHERE time = ?`,
    [...values, timeLabel]
  );

  await queryMySQL(
    `INSERT INTO gdp_thuc (${listColumns.join(",")}) VALUES (?)`,
    [[...values, timeLabel]]
  );

  console.log(`[crawlGDPThuc] Lưu GDP thực tháng ${month}/${year}`);
};

module.exports = { crawlGDPHienHanh, crawlGDPThuc };

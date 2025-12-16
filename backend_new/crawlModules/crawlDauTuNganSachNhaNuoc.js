const XLSX = require("xlsx");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

/**
 * Crawl vốn đầu tư ngân sách nhà nước theo tháng và năm
 * @param {number} month - Tháng (1-12)
 * @param {number} year - Năm (ví dụ: 2025)
 */
const crawlDauTuNganSachNhaNuoc = async (month = 1, year = 2025) => {
  const curMonth = convertMonthNumberToString(month);
  const fileExcelName = `${year}-${curMonth}.xlsx`;
  const timeMonth = getListMonthMap(year)[month - 1];

  // Đọc file Excel
  const workbook = XLSX.readFile(`./file_data/${fileExcelName}`);

  // Lọc sheet phù hợp
  const sheetNames = workbook.SheetNames.filter((name) => {
    const up = name.toUpperCase();
    return (
      (up.includes("VĐT NSNN") ||
        up.includes("VNSNN THÁNG") ||
        up.includes("VDTNSNN") ||
        up.includes("vdt") ||
        up.includes("VDT")) &&
      !up.includes("TTNSNN QUY") &&
      !up.includes("TXH") &&
      !up.includes("NSNN QUY")
    );
  });

  // Tiêu đề và tên cột tương ứng
  const listColumns = [
    "von_nsnn_tong",
    "von_nsnn_trung_uong",
    "von_nsnn_bo_giao_thong_van_tai",
    "von_nsnn_bo_nn_va_ptnt",
    "von_nsnn_bo_tai_nguyen_va_moi_truong",
    "von_nsnn_bo_giao_duc_dao_tao",
    "von_nsnn_bo_van_hoa_the_thao_va_du_lich",
    "von_nsnn_bo_y_te",
    "von_nsnn_bo_cong_thuong",
    "von_nsnn_bo_xay_dung",
    "von_nsnn_bo_thong_tin_va_truyen_thong",
    "von_nsnn_bo_khoa_hoc_va_cong_nghe",
    "von_nsnn_von_ngan_sach_nn_cap_tinh",
    "von_nsnn_von_ngan_sach_nn_cap_huyen",
    "von_nsnn_von_ngan_sach_nn_cap_xa",
    "time",
  ];

  const listTitle = [
    "TỔNG SỐ",
    "Trung ương",
    "Bộ Giao thông vận tải",
    "Bộ NN và PTNT",
    "Bộ Tài nguyên và Môi trường",
    "Bộ Giáo dục và Đào tạo",
    "Bộ Giáo dục - Đào tạo",
    "Bộ Văn hóa, Thể thao và Du lịch",
    "Bộ Y tế",
    "Bộ Công Thương",
    "Bộ Xây dựng",
    "Bộ Thông tin và Truyền thông",
    "Bộ Khoa học và Công nghệ",
    "Vốn ngân sách NN cấp tỉnh",
    "Vốn ngân sách NN cấp huyện",
    "Vốn ngân sách NN cấp xã",
  ];

  const data = [];
  sheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
    });
    rows.forEach((row) => {
      const first = row[0] ? String(row[0]).trim().toLowerCase() : "";
      const second = row[1] ? String(row[1]).trim().toLowerCase() : "";
      const found = listTitle.find((item) => {
        const key = String(item).trim().toLowerCase();
        return first.includes(key) || second.includes(key);
      });
      if (found) {
        data.push(row[3]);
      }
    });
  });

  if (data.length !== listColumns.length - 1) {
    console.warn(
      `[crawlDauTuNganSachNhaNuoc] Dòng trích xuất không khớp: thu được ${
        data.length
      }, mong đợi ${listColumns.length - 1}`
    );
  }

  // Thêm trường time vào cuối
  const values = [...data.slice(0, listColumns.length - 1), timeMonth];

  await queryMySQL(
    `INSERT INTO von_dau_tu_ngan_sach_nha_nuoc (${listColumns.join(
      ","
    )}) VALUES (?)`,
    [values]
  );

  console.log(
    `[crawlDauTuNganSachNhaNuoc] Đã lưu dữ liệu đầu tư ngân sách NN tháng ${month} năm ${year}`
  );
};

module.exports = crawlDauTuNganSachNhaNuoc;

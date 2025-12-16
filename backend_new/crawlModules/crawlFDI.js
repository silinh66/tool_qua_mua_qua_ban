const axios = require("axios");
const cheerio = require("cheerio");
const {
  convertMonthNumberToString,
  getListMonthMap,
} = require("../utils/timeUtils");
const queryMySQL = require("../utils/queryMySQL");

const crawlFDI = async (month = 1, year = 2025) => {
  // Định dạng tháng và thời gian label
  const curMonth = convertMonthNumberToString(month);
  const timeLabel = getListMonthMap(year)[month - 1];

  // URL dữ liệu FDI
  const url = `https://www.mpi.gov.vn/portal/pages/solieudtnn.aspx?nam=${year}&thang=${month}`;

  // Tiêu đề cần trích xuất
  const listTitle = [
    "Vốn thực hiện",
    "Vốn đăng ký*",
    "Đăng ký cấp mới",
    "Đăng ký tăng thêm",
    "Góp vốn, mua cổ phần",
    "Số dự án cấp mới",
    "Số dự án tăng vốn",
    "Góp vốn, mua cổ phần",
  ];

  // Danh sách cột tương ứng trong CSDL
  const listColumns = [
    "von_thuc_hien_fdi",
    "von_dang_ky_fdi",
    "dang_ky_cap_moi_fdi",
    "dang_ky_tang_them_fdi",
    "gop_von_mua_co_phan_fdi",
    "so_du_an_cap_moi_fdi",
    "so_du_an_tang_von_fdi",
    "so_du_an_gop_von_mua_co_phan_fdi",
    "time",
  ];

  // Lấy HTML từ trang
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Chọn bảng dữ liệu theo lũy kế
  const table = $('div[id$="_PanelLuyKe"] table').first();
  const values = [];

  // Duyệt qua các dòng trong bảng
  table.find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length >= 4) {
      const titleText = $(tds[1]).text().trim();
      const found = listTitle.find((item) => titleText.includes(item));
      if (found) {
        // Giá trị tháng hiện tại nằm ở cột thứ 4
        const raw = $(tds[3]).text().trim();
        // Chuyển định dạng "1.510" -> 1510, "4.334,79" -> 4334.79
        const num = raw
          ? parseFloat(raw.replace(/\./g, "").replace(",", "."))
          : null;
        values.push(num);
      }
    }
  });

  if (values.length !== listTitle.length) {
    console.warn(
      `[Crawl FDI] Đã trích xuất ${values.length} mục, nhưng mong đợi ${listTitle.length} mục.`
    );
  }

  // Lưu vào cơ sở dữ liệu
  await queryMySQL(`INSERT INTO fdi (${listColumns.join(",")}) VALUES (?)`, [
    [...values, timeLabel],
  ]);

  console.log(
    `[Crawl FDI] Đã lưu dữ liệu FDI tháng ${month} năm ${year} vào cơ sở dữ liệu.`
  );
};

module.exports = crawlFDI;

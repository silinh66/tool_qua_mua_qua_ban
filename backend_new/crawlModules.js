const { crawlGDPHienHanh, crawlGDPThuc } = require("./crawlModules/crawlGDP");
const crawlCPI = require("./crawlModules/crawlCPI");
const crawlFDI = require("./crawlModules/crawlFDI");
const crawlTongMucBanLe = require("./crawlModules/crawlTongMucBanLe");
const crawlXuatNhapKhau = require("./crawlModules/crawlXuatNhapKhau");
const crawlDauTuNganSachNhaNuoc = require("./crawlModules/crawlDauTuNganSachNhaNuoc");
const crawlVonDauTuTheoTinhThanh = require("./crawlModules/crawlVonDauTuTheoTinhThanh");

(async () => {
  const month = 5;
  const year = 2025;

  //GDP chạy riêng 3 tháng 1 lần
  if (month % 3 === 0) {
    await crawlGDPHienHanh(month, year);
    await crawlGDPThuc(month, year);
  }

  // Chạy các module crawl khác chạy 1 tháng 1 lần
  // await crawlCPI(month, year);
  // await crawlFDI(month, year);
  // await crawlTongMucBanLe(month, year);
  // await crawlXuatNhapKhau(month, year);
  // await crawlVonDauTuTheoTinhThanh(month, year);

  //Bị sáp nhập và đổi tên bộ nên phải sửa lại hàm
  //   await crawlDauTuNganSachNhaNuoc(month, year);
})();

// controllers/miscDataController.js
const queryMySQL = require("../utils/queryMySQL");

const moment = require("moment");

/**
 * Helper: chạy queryMySQL promise-based
 */
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. GET /gia_xang_dau
 *    - SELECT * FROM gia_xang_dau
 */
exports.getGiaXangDau = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_xang_dau ");
    res.send({ error: false, data: data, message: "gia_xang_dau list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /ty_gia_ngoai_te
 *    - SELECT * FROM ty_gia_ngoai_te
 */
exports.getTyGiaNgoaiTe = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM ty_gia_ngoai_te ");
    res.send({ error: false, data: data, message: "ty_gia_ngoai_te list." });
  } catch (err) {
    next(err);
  }
};

const downsampleData = (data, targetCount) => {
  if (data.length <= targetCount) {
    return data; // Nếu số lượng dữ liệu ít hơn hoặc bằng targetCount, trả về toàn bộ dữ liệu
  }

  const downsampled = [];
  const step = Math.floor(data.length / targetCount); // Tính bước nhảy để lấy dữ liệu

  for (let i = 0; i < targetCount; i++) {
    downsampled.push(data[i * step]); // Lấy phần tử tại chỉ số i * step
  }
  //push last item into final data
  downsampled.push(data[data.length - 1]);
  return downsampled;
};

/**
 * 3. GET /thanh_khoan_data/current/:type
 *    - Params: type = 'hose' | 'hnx'
 *    - SELECT * FROM thanh_khoan_data WHERE date_type = 'current' AND type = ?
 *    - Sau đó downsample về 100 points
 */
exports.getThanhKhoanCurrent = async (req, res, next) => {
  try {
    const type = req.params.type;
    let sql = `SELECT * FROM thanh_khoan_data WHERE date_type = 'current' AND type = '${type}'`;
    let data = await queryMySQL(sql);
    data = downsampleData(data, 100); // Target 1000 points
    res.send({
      error: false,
      data: data,
      message: "Current thanh_khoan data list.",
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "Error fetching current thanh_khoan data: " + err.message,
    });
  }
};

/**
 * 4. GET /thanh_khoan_data/historical/:type
 *    - Params: type = 'hose' | 'hnx'
 *    - SELECT * FROM thanh_khoan_data WHERE date_type = 'historical' AND type = ?
 *    - Sau đó downsample về 100 points
 */
exports.getThanhKhoanHistorical = async (req, res, next) => {
  try {
    const type = req.params.type;

    let sql = `SELECT * FROM thanh_khoan_data WHERE date_type = 'historical' AND type = '${type}'`;
    let data = await queryMySQL(sql);
    data = downsampleData(data, 100); // Target 1000 points
    res.send({
      error: false,
      data: data,
      message: "Historical thanh_khoan data list.",
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "Error fetching historical thanh_khoan data: " + err.message,
    });
  }
};

/**
 * 5. GET /report-chart
 *    - queryMySQL: symbol
 *    - SELECT từ can_doi_ke_toan, infocompany để lấy superSector, sau đó
 *      SELECT from luu_chuyen_tien_te và ket_qua_kinh_doanh, map ra cấu trúc response
 */
exports.getReportChart = async (req, res, next) => {
  try {
    let { symbol } = req.query;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }

    let dataCanDoiKeToan = [];
    let dataLuuChuyenTienTe = [];
    let dataKetQuaKinhDoanh = [];

    let queryCommand = `SELECT * FROM can_doi_ke_toan WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
    let result = await queryMySQL(queryCommand);
    dataCanDoiKeToan = [...result];
    let queryInfo = `SELECT * FROM info_company WHERE symbol = '${symbol}'`;
    let resultQuery = await queryMySQL(queryInfo);
    let currentInfo = resultQuery[0];
    let superSector = currentInfo?.superSector;

    let dataMapCanDoiKeToan = [];
    let dataMapKetQuaKinhDoanh = [];
    let dataMapLuuChuyenTienTe = [];

    if (superSector === "Bảo hiểm") {
      dataMapCanDoiKeToan = result.map((item, index) => {
        let dauTuTaiChinhNganHanYoy = 0;
        let gap = item.quarterReport !== 5 ? -5 : -1;

        let dauTuTaiChinhNganHanYoYCurrent = result[index]?.bsa5;
        let dauTuTaiChinhNganHanYoYLastYear = result[index + gap]?.bsa5;
        dauTuTaiChinhNganHanYoy =
          ((dauTuTaiChinhNganHanYoYCurrent - dauTuTaiChinhNganHanYoYLastYear) /
            dauTuTaiChinhNganHanYoYLastYear) *
          100;
        //lam tron 2 chu so thap phan
        dauTuTaiChinhNganHanYoy =
          Math.round(dauTuTaiChinhNganHanYoy * 100) / 100;

        return {
          ...item,
          taiSan: {
            tienVaTuongDuongTien: item.bsa2,
            dauTuNganHan: item.bsa5,
            dauTuTaiChinhNganHanYoy,
            dauTuDaiHan: item.bsa43,
            cacKhoanPhaiThu: item.bsa8,
            hangTonKhoRong: item.bsa15,
            taiSanNganHanKhac: item.bsa18,
            taiSanTaiBaoHiem: item.bsi192,
            phaiThuDaiHan: item.bsa24,
            taiSanCoDinh: item.bsa29,
            batDongSanDauTu: item.bsa40,
            taiSanDoDangDaiHan: item.bsa163,
            cacKhoanDauTuTaiChinhDaiHan: item.bsa43,
            taiSanDaiHanKhac: item.bsa49,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
          nguonVon: {
            noNganHan: item.bsa55,
            noDaiHan: item.bsa67,
            vonChuSoHuu: item.bsa78,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
        };
      });
    } else if (superSector === "Ngân hàng") {
      dataMapCanDoiKeToan = result.map((item) => {
        return {
          ...item,
          taiSan: {
            tienMatVangBacDaQuy: item.bsa2,
            tienGuiTaiNganHangNhaNuocVietNam: item.bsb97,
            tienGuiTaiCacTCTDKhacVaChoVayCacTCTDKhac: item.bsb98,
            chungKhoanKinhDoanh: item.bsb99,
            cacCongCuTaiChinhPhaiSinhVaCacTaiSanTaiChinhKhac: item.bsb102,
            choVayKhachHang: item.bsb103,
            chungKhoanDauTu: item.bsb106,
            gopVonDauTuDaiHan: item.bsa43,
            taiSanCoDinh: item.bsa29,
            giaTriRongTaiSanDauTu: item.bsa40,
            taiSanCoKhac: item.bsb110,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
          nguonVon: {
            loiIchCuaCoDongThieuSo: item.bsa95,
            loiNhuanChuaPhanPhoi: item.bsa90,
            chenhLechDanhGiaLaiTaiSan: item.bsa84,
            chenhLechTiGiaHoiDoai: item.bsa85,
            quyCuaToChucTinDung: item.bsb121,
            vonCuaToChucTinDung: item.bsb118,
            cacKhoanNoKhac: item.bsb117,
            phatHanhGiayToCoGia: item.bsb116,
            vonTaiTroUyThacDauTuCuaChinhPhuVaCacToChucTinDungKhac: item.bsb115,
            cacCongCuTaiChinhPhaiSinhVaCacKhoanNoTaiChinhKhac: item.bsb114,
            cacKhoanNoChinhPhuVaNHNNVietNam: item.bsb111,
            tienGuiCuaKhacHang: item.bsb113,
            tienGuiVaVayCacToChucTinDungKhac: item.bsb112,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
        };
      });
    } else if (superSector === "Dịch vụ tài chính") {
      dataMapCanDoiKeToan = result.map((item) => {
        return {
          ...item,
          taiSan: {
            taiSanTaiChinhNganHan: item.bss214,
            taiSanLuuDongKhac: item.bsa18,
            taiSanTaiChinhDaiHan: item.bsa43,
            taiSanCoDinh: item.bsa29,
            giaTriRongBatDongSanDauTu: item.bsa40,
            taiSanDoDangDaiHan: item.bsa163,
            taiSanDaiHanKhac: item.bsa49,
            tienVaTuongDuongTien: item.bsa2,
            giaTriThuanDauTuTaiSanTaiChinhNganHan: item.bsa5,
            tongCacKhoanPhaiThu: item.bsa8,
            hangTonKhoRong: item.bsa15,
            dauTuDaiHan: item.bsa43,

            quarter: item.quarterReport,
            year: item.yearReport,
          },
          nguonVon: {
            noNganHan: item.bsa55,
            noDaiHan: item.bsa67,
            vonVaCacQuy: item.bsa78,
            loiIchCuaCoDongThieuSo: item.bsa95,

            quarter: item.quarterReport,
            year: item.yearReport,
          },
        };
      });
    } else {
      dataMapCanDoiKeToan = result.map((item) => {
        return {
          ...item,
          taiSan: {
            tienVaTuongDuongTien: item.bsa2,
            giaTriThuanDauTuNganHan: item.bsa5,
            dauTuDaiHan: item.bsa43,
            cacKhoanPhaiThu: item.bsa8,
            hangTonKhoRong: item.bsa15,
            taiSanLuuDongKhac: item.bsa18,
            phaiThuDaiHan: item.bsa24,
            taiSanCoDinh: item.bsa29,
            giaTriRongTaiSanDauTu: item.bsa40,
            taiSanDoDangDaiHan: item.bsa163,
            dauTuDaiHan: item.bsa43,
            taiSanDaiHanKhac: item.bsa49,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
          nguonVon: {
            noNganHan: item.bsa55,
            noDaiHan: item.bsa67,
            vonVaCacQuy: item.bsa78,
            loiIchCuaCoDongThieuSo: item.bsa95,
            quarter: item.quarterReport,
            year: item.yearReport,
          },
        };
      });
    }

    queryCommand = `SELECT * FROM luu_chuyen_tien_te WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
    result = await queryMySQL(queryCommand);
    dataLuuChuyenTienTe = [...result];
    dataMapLuuChuyenTienTe = result.map((item, index) => {
      return {
        ...item,
        luuChuyenTien: {
          LCTTTuHoatDongDauTu: item.cfa26,
          LCTTTuaHoatDongTaiChinh: item.cfa34,
          LCTTTuHoatDongKinhDoanh: item.cfa18,
          tienVaTuongDuongCuoiKi: item.cfa38,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });

    queryCommand = `SELECT * FROM ket_qua_kinh_doanh WHERE organCode = '${symbol}' ORDER BY yearReport,quarterReport`;
    result = await queryMySQL(queryCommand);
    dataKetQuaKinhDoanh = [...result];
    dataMapKetQuaKinhDoanh = result.map((item, index) => {
      let doanhThuThuanYoy = 0;
      let loiNhuanTruocThueYoy = 0;
      let loiNhuanSauThueYoy = 0;
      let loiNhuanSauThueChuSoHuuYoy = 0;
      let chiPhiDuPhongRuiRoTinDungYoy = 0;
      let doanhThuPhiBaoHiemYoy = 0;
      let thuNhapLaiVaCacKhoanTuongTuYoy = 0;

      let gap = item.quarterReport !== 5 ? -5 : -1;
      if (
        index + gap <= result.length - 1 &&
        result[index + gap]?.quarterReport === item.quarterReport &&
        result[index + gap]?.yearReport === item.yearReport - 1
      ) {
        let doanhThuThuanCurrent = result[index].isa3;
        let doanhThuThuanLastYear = result[index + gap].isa3;
        doanhThuThuanYoy =
          ((doanhThuThuanCurrent - doanhThuThuanLastYear) /
            doanhThuThuanLastYear) *
          100;
        //lam tron 2 chu so thap phan
        doanhThuThuanYoy = Math.round(doanhThuThuanYoy * 100) / 100;

        let loiNhuanTruocThueCurrent = result[index].isa16;
        let loiNhuanTruocThueLastYear = result[index + gap].isa16;
        loiNhuanTruocThueYoy =
          ((loiNhuanTruocThueCurrent - loiNhuanTruocThueLastYear) /
            loiNhuanTruocThueLastYear) *
          100;
        //lam tron 2 chu so thap phan
        loiNhuanTruocThueYoy = Math.round(loiNhuanTruocThueYoy * 100) / 100;

        let loiNhuanSauThueCurrent = result[index].isa20;
        let loiNhuanSauThueLastYear = result[index + gap].isa20;
        loiNhuanSauThueYoy =
          ((loiNhuanSauThueCurrent - loiNhuanSauThueLastYear) /
            loiNhuanSauThueLastYear) *
          100;

        let loiNhuanSauThueChuSoHuuCurrent = result[index].isa22;
        let loiNhuanSauThueChuSoHuuLastYear = result[index + gap].isa22;
        loiNhuanSauThueChuSoHuuYoy =
          ((loiNhuanSauThueChuSoHuuCurrent - loiNhuanSauThueChuSoHuuLastYear) /
            loiNhuanSauThueChuSoHuuLastYear) *
          100;
        //lam tron 2 chu so thap phan
        loiNhuanSauThueChuSoHuuYoy =
          Math.round(loiNhuanSauThueChuSoHuuYoy * 100) / 100;

        let chiPhiDuPhongRuiRoTinDungCurrent = result[index].isa41;
        let chiPhiDuPhongRuiRoTinDungLastYear = result[index + gap].isa41;
        chiPhiDuPhongRuiRoTinDungYoy =
          ((chiPhiDuPhongRuiRoTinDungCurrent -
            chiPhiDuPhongRuiRoTinDungLastYear) /
            chiPhiDuPhongRuiRoTinDungLastYear) *
          100;
        //lam tron 2 chu so thap phan
        chiPhiDuPhongRuiRoTinDungYoy =
          Math.round(chiPhiDuPhongRuiRoTinDungYoy * 100) / 100;

        let doanhThuPhiBaoHiemCurrent = result[index].isi103;
        let doanhThuPhiBaoHiemLastYear = result[index + gap].isi103;
        doanhThuPhiBaoHiemYoy =
          ((doanhThuPhiBaoHiemCurrent - doanhThuPhiBaoHiemLastYear) /
            doanhThuPhiBaoHiemLastYear) *
          100;
        //lam tron 2 chu so thap phan
        doanhThuPhiBaoHiemYoy = Math.round(doanhThuPhiBaoHiemYoy * 100) / 100;

        let thuNhapLaiVaCacKhoanTuongTuCurrent = result[index].isb25;
        let thuNhapLaiVaCacKhoanTuongTuLastYear = result[index + gap].isb25;
        thuNhapLaiVaCacKhoanTuongTuYoy =
          ((thuNhapLaiVaCacKhoanTuongTuCurrent -
            thuNhapLaiVaCacKhoanTuongTuLastYear) /
            thuNhapLaiVaCacKhoanTuongTuLastYear) *
          100;
        //lam tron 2 chu so thap phan
        thuNhapLaiVaCacKhoanTuongTuYoy =
          Math.round(thuNhapLaiVaCacKhoanTuongTuYoy * 100) / 100;
      }
      return {
        ...item,
        doanhThuThuan: {
          doanhThuThuan: item.isa3,
          doanhThuHoatDongTaiChinh: item?.iss141,
          doanhThuThuanYoY: doanhThuThuanYoy,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
        coCauLoiNhuanTruocThue: {
          loiNhuanKhac: item.isa14,
          laiLoTuCongTyLDLK: item.isa102,
          loiNhuanTaiChinh: item.isa15,
          loiNhuanThuanTuHDKDChinh: item.ebit,
          loiNhuanTruocThueYOY: loiNhuanTruocThueYoy,
          quarter: item.quarterReport,
          year: item.yearReport,
        },
        loiNhuanSauThue: {
          loiNhuanSauThue: item.isa20,
          loiNhuanSauThueYOY: loiNhuanSauThueYoy,
          loiNhuanSauThueChuSoHuu: item?.isa22,
          loiNhuanSauThueChuSoHuuYOY: loiNhuanSauThueChuSoHuuYoy,
          chiPhiDuPhongRuiRoTinDung: item?.isa41,
          chiPhiDuPhongRuiRoTinDungYOY: chiPhiDuPhongRuiRoTinDungYoy,
          doanhThuPhiBaoHiem: item?.isi103,
          doanhThuPhiBaoHiemYoy: doanhThuPhiBaoHiemYoy,
          thuNhapLaiVaCacKhoanTuongTu: item?.isb25,
          thuNhapLaiVaCacKhoanTuongTuYoy: thuNhapLaiVaCacKhoanTuongTuYoy,

          quarter: item.quarterReport,
          year: item.yearReport,
        },
      };
    });

    let dataMapKetQuaKinhDoanhQuarter = dataMapKetQuaKinhDoanh.filter(
      (item) => item.quarterReport !== 5
    );
    let dataMapCanDoiKeToanQuarter = dataMapCanDoiKeToan.filter(
      (item) => item.quarterReport !== 5
    );
    let dataMapLuuChuyenTienTeQuarter = dataMapLuuChuyenTienTe.filter(
      (item) => item.quarterReport !== 5
    );
    let dataMapKetQuaKinhDoanhYear = dataMapKetQuaKinhDoanh.filter(
      (item) => item.quarterReport === 5
    );
    let dataMapCanDoiKeToanYear = dataMapCanDoiKeToan.filter(
      (item) => item.quarterReport === 5
    );
    let dataMapLuuChuyenTienTeYear = dataMapLuuChuyenTienTe.filter(
      (item) => item.quarterReport === 5
    );

    res.send({
      error: false,
      data: {
        superSector,
        // luuChuyenTien: dataLuuChuyenTienTe,
        // canDoiKeToan: dataCanDoiKeToan,
        // ketQuaKinhDoanh: dataKetQuaKinhDoanh,
        quarter: {
          luuChuyenTien: dataLuuChuyenTienTe.filter(
            (item) => item.quarterReport !== 5
          ),
          canDoiKeToan: dataCanDoiKeToan.filter(
            (item) => item.quarterReport !== 5
          ),
          ketQuaKinhDoanh: dataKetQuaKinhDoanh.filter(
            (item) => item.quarterReport !== 5
          ),
          taiSan: dataMapCanDoiKeToanQuarter.map((item) => item.taiSan),
          nguonVon: dataMapCanDoiKeToanQuarter.map((item) => item.nguonVon),
          luuChuyenTien: dataMapLuuChuyenTienTeQuarter.map(
            (item) => item.luuChuyenTien
          ),
          doanhThuThuan: dataMapKetQuaKinhDoanhQuarter.map(
            (item) => item.doanhThuThuan
          ),
          coCauLoiNhuanTruocThue: dataMapKetQuaKinhDoanhQuarter.map(
            (item) => item.coCauLoiNhuanTruocThue
          ),
          loiNhuanSauThue: dataMapKetQuaKinhDoanhQuarter.map(
            (item) => item.loiNhuanSauThue
          ),
        },
        year: {
          luuChuyenTien: dataLuuChuyenTienTe.filter(
            (item) => item.quarterReport === 5
          ),
          canDoiKeToan: dataCanDoiKeToan.filter(
            (item) => item.quarterReport === 5
          ),
          ketQuaKinhDoanh: dataKetQuaKinhDoanh.filter(
            (item) => item.quarterReport === 5
          ),
          taiSan: dataMapCanDoiKeToanYear.map((item) => item.taiSan),
          nguonVon: dataMapCanDoiKeToanYear.map((item) => item.nguonVon),
          luuChuyenTien: dataMapLuuChuyenTienTeYear.map(
            (item) => item.luuChuyenTien
          ),
          doanhThuThuan: dataMapKetQuaKinhDoanhYear.map(
            (item) => item.doanhThuThuan
          ),
          coCauLoiNhuanTruocThue: dataMapKetQuaKinhDoanhYear.map(
            (item) => item.coCauLoiNhuanTruocThue
          ),
          loiNhuanSauThue: dataMapKetQuaKinhDoanhYear.map(
            (item) => item.loiNhuanSauThue
          ),
        },
      },
      message: "reports list.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. GET /sub-companies
 *    - queryMySQL: symbol
 *    - SELECT * FROM sub_company WHERE parentSymbol = ?
 */
exports.getSubCompanies = async (req, res, next) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    queryMySQLCommand = `SELECT * FROM sub_company WHERE parentSymbol = '${symbol}'`;
    result = await queryMySQL(queryMySQLCommand);
    res.send({
      code: "SUCCESS",
      message: "Get sub companies data success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /leadership
 *    - queryMySQL: symbol
 *    - SELECT * FROM leadership WHERE symbol = ?
 */
exports.getLeadership = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL("SELECT * FROM leadership WHERE symbol = ?", [
      symbol,
    ]);
    res.send({
      code: "SUCCESS",
      message: "Get leadership data success",
      data: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /company-statistic
 *    - queryMySQL: symbol
 *    - SELECT * FROM company_statistic WHERE symbol = ?
 */
exports.getCompanyStatistic = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL(
      "SELECT * FROM company_statistic WHERE symbol = ?",
      [symbol]
    );
    res.send({
      code: "SUCCESS",
      message: "Get company statistics data success",
      data: data.length > 0 ? data[0] : {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. POST /nhom-nganh
 *    - Body: { symbols: [<symbol>] }
 *    - SELECT * FROM info_company WHERE symbol IN (?)
 */
exports.getSuperSectors = async (req, res, next) => {
  try {
    let symbols = req?.body?.symbols;
    //get nhóm ngành từ bảng info_company trường superSector
    let queryCommand = `SELECT * FROM info_company WHERE symbol IN (${symbols
      ?.map((item) => `'${item}'`)
      ?.join(",")})`;
    let result = await queryMySQL(queryCommand);
    res.send({
      code: "SUCCESS",
      message: "Get nhóm ngành data success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. GET /get-my-filter
 *     - JWT required
 *     - SELECT * FROM my_filter WHERE userId = ?
 */
exports.getMyFilter = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const filters = await queryMySQL(
      "SELECT * FROM `my_filter` WHERE userId = ?",
      [userId]
    );
    res.send({ success: true, data: filters });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. POST /add-my-filter
 *     - JWT required
 *     - Body: { fieldName, conditions }
 *     - userId lấy từ token
 */
exports.addMyFilter = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { listFilter } = req.body;
    if (!userId || !Array.isArray(listFilter)) {
      return res
        .status(400)
        .send({ error: true, message: "Invalid data format" });
    }
    // Xóa các bộ lọc cũ
    await queryMySQL("DELETE FROM `my_filter` WHERE userId = ?", [userId]);

    // Thêm các bộ lọc mới
    for (const filter of listFilter) {
      await queryMySQL(
        "INSERT INTO `my_filter` (userId, label, isMultiple) VALUES (?, ?, ?)",
        [userId, filter.label, filter.isMultiple]
      );
    }

    res.send({ success: true, message: "Filters added successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 12. PUT /update-my-filter/:id
 *     - JWT required
 *     - Params: id = filterID
 *     - Body: { fieldName, conditions }
 */
exports.updateMyFilter = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { listFilter } = req.body;
    if (!userId || !Array.isArray(listFilter)) {
      return res
        .status(400)
        .send({ error: true, message: "Invalid data format" });
    }
    // Xóa các bộ lọc cũ
    await queryMySQL("DELETE FROM `my_filter` WHERE userId = ?", [userId]);

    // Thêm các bộ lọc mới
    for (const filter of listFilter) {
      await queryMySQL(
        "INSERT INTO `my_filter` (userId, label, isMultiple) VALUES (?, ?, ?)",
        [userId, filter.label, filter.isMultiple]
      );
    }

    res.send({ success: true, message: "Filters updated successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 13. GET /get-config-filter
 *     - JWT required
 *     - SELECT * FROM setting_conditions WHERE userId = ?
 */
exports.getConfigFilter = async (req, res, next) => {
  try {
    const response = await axios.get("https://nguoiquansat.vn/");
    const html = response.data;
    const $ = cheerio.load(html);

    const posts = [];

    $("ul li").each((index, element) => {
      const titleElement = $(element).find(".b-grid__title a");
      const title = titleElement.text().trim();
      const href = titleElement.attr("href");
      const thumbnailUrl = $(element).find(".b-grid__img img").attr("src");
      const descElement = $(element).find(".b-grid__desc");
      const description =
        descElement.length > 0 ? descElement.text().trim() : "";

      // Skip the post if title, href, or thumbnailUrl is empty
      if (title !== "" && href !== "" && thumbnailUrl !== "") {
        posts.push({
          title,
          href,
          thumbnailUrl,
          description,
        });
      }
    });

    res.send({ error: false, data: posts, message: "news list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 14. GET /get-news
 *     - SELECT * FROM news_all
 */
exports.getAllNews = async (req, res, next) => {
  try {
    const data = await runQuery("SELECT * FROM news_all");
    return res.json({ error: false, data, message: "news_all list." });
  } catch (err) {
    next(err);
  }
};

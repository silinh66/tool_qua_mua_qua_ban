// controllers/marketMiscController.js
const queryMySQL = require("../utils/queryMySQL");

/**
 * 90. GET /financial-ratio
 *    - queryMySQL: symbol, type ('year' hoặc 'quarter').
 */
exports.getFinancialRatio = async (req, res, next) => {
  try {
    let symbol = req.query?.symbol;
    let type = req.query?.type;
    let financialRatio = await queryMySQL(
      `SELECT * FROM financial_ratio WHERE organCode = ? and lengthReport ${
        type === "year" ? ">= 5" : "< 5"
      }`,
      [symbol]
    );
    let financialRatioMap = financialRatio.map((item) => {
      return {
        key: `${item.yearReport}_${item.lengthReport}`,
        value: item,
      };
    });
    res.json({ success: true, items: financialRatioMap });
  } catch (err) {
    next(err);
  }
};

/**
 * 91. GET /co-dong
 *    - queryMySQL: symbol
 */
exports.getCoDong = async (req, res, next) => {
  try {
    let symbol = req.query?.symbol;
    let listCoDong = await queryMySQL(
      "SELECT * FROM co_dong WHERE symbol = ?",
      [symbol]
    );

    res.json({
      success: true,
      listCoDong: listCoDong,
      // listCoDong: data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 92. GET /pe-nganh
 *    - Hiện chưa có dữ liệu, trả về { success: true, data: [] }
 */
exports.getPeNganh = (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      // data: dataPE,
    });
  } catch (error) {
    res.json({
      success: false,
      data: [],
    });
  }
};

/**
 * 93. GET /data-vi-mo
 *    - Lấy dữ liệu vĩ mô từ nhiều bảng: gdp_danh_nghia, gdp_thuc, tong_muc_banle_dichvu,
 *      cpi, xuat_nhap_khau, fdi, von_dau_tu_nn, khoi_luong_cn, pmi, iip
 */
exports.getDataViMo = async (req, res, next) => {
  try {
    // You can modify this part to select specific fields or join with other tables if necessary
    let gdpDanhNghia = await queryMySQL(
      "SELECT * FROM gdp_danh_nghia ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM gdp_danh_nghia WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let gdpThuc = await queryMySQL(
      "SELECT * FROM gdp_thuc ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM gdp_thuc WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let tongMucBanLeDichVu = await queryMySQL(
      "SELECT * FROM tong_muc_ban_le_dich_vu ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM tong_muc_ban_le_dich_vu WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let cpi = await queryMySQL(
      "SELECT * FROM cpi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM cpi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let xuatNhapKhau = await queryMySQL(
      "SELECT * FROM xuat_nhap_khau ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM xuat_nhap_khau WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let fdi = await queryMySQL(
      "SELECT * FROM fdi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM fdi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let vonDauTuNganSachNhaNuoc = await queryMySQL(
      "SELECT * FROM von_dau_tu_ngan_sach_nha_nuoc ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM von_dau_tu_ngan_sach_nha_nuoc WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let khoiLuongSanXuatCongNghiep = await queryMySQL(
      "SELECT * FROM khoi_luong_san_xuat_cong_nghiep ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM khoi_luong_san_xuat_cong_nghiep WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let pmi = await queryMySQL(
      "SELECT * FROM pmi ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM pmi WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );
    let iip = await queryMySQL(
      "SELECT * FROM iip ORDER BY STR_TO_DATE(time, '%d/%m/%Y');"
      // "SELECT * FROM iip WHERE YEAR(STR_TO_DATE(time, '%d/%m/%Y')) BETWEEN 2018 AND 2023;"
    );

    res.send({
      code: "SUCCESS",
      message: "Get macroeconomic data successfully",
      data: {
        gdpDanhNghia: {
          gdpDanhNghia: gdpDanhNghia?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.gdp_theo_gia_hien_hanh /
                gdpDanhNghia[index - 4]?.gdp_theo_gia_hien_hanh) *
                100 -
              100,
          })),
          header: [
            "GDP theo giá hiện hành",
            "GDP HH Nông nghiệp, lâm nghiệp và thủy sản",
            "GDP HH Nông nghiệp",
            "GDP HH Lâm nghiệp",
            "GDP HH Thủy sản",
            "GDP HH Công nghiệp và xây dựng",
            "GDP HH Công nghiệp",
            "GDP HH Khai khoáng",
            "GDP HH Công nghiệp chế biến, chế tạo",
            "GDP HH Sản xuất và phân phối điện",
            "GDP HH Cung cấp nước và xử lý nước thải",
            "GDP HH Xây dựng",
            "GDP HH Dịch vụ",
            "GDP HH Bán buôn bán lẻ, sửa chữa ô tô, mô tô, xe máy",
            "GDP HH Vận tải kho bãi",
            "GDP HH Dịch vụ lưu trú và ăn uống",
            "GDP HH Thông tin và truyền thông",
            "GDP HH Hoạt động tài chính, ngân hàng và bảo hiểm",
            "GDP HH Hoạt động kinh doanh bất động sản",
            "GDP HH Hoạt động chuyên môn, khoa học và công nghệ",
            "GDP HH Hoạt động hành chính và dịch vụ hỗ trợ",
            "GDP HH Hoạt động của các tổ chức chính trị",
            "GDP HH Giáo dục đào tạo",
            "GDP HH Y tế và hoạt động cứu trợ xã hội",
            "GDP HH Nghệ thuật, vui chơi và giải trí",
            "GDP HH Hoạt động dịch vụ khác",
            "GDP HH Hoạt động làm thuê các công việc trong các hộ gia đình",
            "GDP HH Thuế sản phẩm trừ trợ cấp sản phẩm",
          ],
        },
        gdpThuc: {
          gdpThuc: gdpThuc?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.gdp_so_sanh / gdpThuc[index - 4]?.gdp_so_sanh) * 100 - 100,
          })),

          header: [
            "GDP So sánh",
            "GDP Nông nghiệp, lâm nghiệp và thủy sản",
            "GDP Nông nghiệp",
            "GDP Lâm nghiệp",
            "GDP Thủy sản",
            "GDP Công nghiệp và xây dựng",
            "GDP Công nghiệp",
            "GDP Khai khoáng",
            "GDP Sản xuất và phân phối điện",
            "GDP Công nghiệp chế biến, chế tạo",
            "GDP Cung cấp nước và xử lý nước thải",
            "GDP Xây dựng",
            "GDP Dịch vụ",
            "GDP Vận tải kho bãi",
            "GDP Bán buôn bán lẻ, sửa chữa ô tô, mô tô, xe máy",
            "GDP Dịch vụ lưu trú và ăn uống",
            "GDP Thông tin và truyền thông",
            "GDP Hoạt động tài chính, ngân hàng và bảo hiểm",
            "GDP Hoạt động kinh doanh bất động sản",
            "GDP Hoạt động chuyên môn, khoa học và công nghệ",
            "GDP Hoạt động hành chính và dịch vụ hỗ trợ",
            "GDP Hoạt động của các tổ chức chính trị",
            "GDP Giáo dục đào tạo",
            "GDP Y tế và hoạt động cứu trợ xã hội",
            "GDP Nghệ thuật, vui chơi và giải trí",
            "GDP Hoạt động dịch vụ khác",
            "GDP Hoạt động làm thuê các công việc trong các hộ gia đình",
            "GDP Thuế sản phẩm trừ trợ cấp sản phẩm",
          ],
        },
        tongMucBanLeDichVu: {
          tongMucBanLeDichVu: tongMucBanLeDichVu.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.tong_ban_le_hh_va_dv /
                tongMucBanLeDichVu[index - 12]?.tong_ban_le_hh_va_dv) *
                100 -
              100,
          })),
          header: [
            "Tổng bán lẻ HH và DV",
            "Bán lẻ Dịch vụ lưu trú, ăn uống",
            "Bán lẻ Hàng hoá",
            "Bán lẻ Du lịch lữ hành",
            "Bán lẻ Dịch vụ khác",
          ],
        },
        cpi: {
          cpi: cpi?.map((item) => {
            return {
              ...item,
              CPI: item?.CPI - 100,
              CPI_an_uong_ngoai_gia_dinh:
                item?.CPI_an_uong_ngoai_gia_dinh - 100,
              CPI_buu_chinh_vien_thong: item?.CPI_buu_chinh_vien_thong - 100,
              CPI_dich_vu_giao_duc: item?.CPI_dich_vu_giao_duc - 100,
              CPI_dich_vu_y_te: item?.CPI_dich_vu_y_te - 100,
              CPI_do_uong_va_thuoc_la: item?.CPI_do_uong_va_thuoc_la - 100,
              CPI_giao_duc: item?.CPI_giao_duc - 100,
              CPI_giao_thong: item?.CPI_giao_thong - 100,
              CPI_hang_an_va_dich_vu_an_uong:
                item?.CPI_hang_an_va_dich_vu_an_uong - 100,
              CPI_hang_hoa_va_dich_vu_khac:
                item?.CPI_hang_hoa_va_dich_vu_khac - 100,
              CPI_luong_thuc: item?.CPI_luong_thuc - 100,
              CPI_may_mac_mu_non_giay_dep:
                item?.CPI_may_mac_mu_non_giay_dep - 100,
              CPI_nha_o_va_vat_lieu_xay_dung:
                item?.CPI_nha_o_va_vat_lieu_xay_dung - 100,
              CPI_thiet_bi_va_do_dung_gia_dinh:
                item?.CPI_thiet_bi_va_do_dung_gia_dinh - 100,
              CPI_thuc_pham: item?.CPI_thuc_pham - 100,
              CPI_thuoc_va_dich_vu_y_te: item?.CPI_thuoc_va_dich_vu_y_te - 100,
              CPI_van_hoa_giai_tri_va_du_lich:
                item?.CPI_van_hoa_giai_tri_va_du_lich - 100,
            };
          }),
          header: [
            "CPI",
            "CPI Hàng ăn và dịch vụ ăn uống",
            "CPI Lương thực",
            "CPI Thực phẩm",
            "CPI Ăn uống ngoài gia đình",
            "CPI Đồ uống và thuốc lá",
            "CPI May mặc, mũ nón, giầy dép",
            "CPI Nhà ở và vật liệu xây dựng",
            "CPI Thiết bị và đồ dùng gia đình",
            "CPI Thuốc và dịch vụ y tế",
            "CPI Dịch vụ y tế",
            "CPI Giao thông",
            "CPI Bưu chính viễn thông",
            "CPI Giáo dục",
            "CPI Dịch vụ giáo dục",
            "CPI Hàng hoá và dịch vụ khác",
            "CPI Văn hoá, giải trí và du lịch",
          ],
        },
        xuatNhapKhau: {
          xuatNhapKhau: xuatNhapKhau?.map((item, index) => ({
            ...item,
            tangTruongCungKy:
              (item?.XK_tong / xuatNhapKhau[index - 4]?.XK_tong) * 100 - 100,
            thangDuThuongMai: item?.XK_tong - item?.NK_tong,
          })),
          header: [
            "XK Tổng",
            "XK Khu vực trong nước",
            "XK Khu vực trong FDI",
            "NK Tổng",
            "NK Khu vực trong nước",
            "NK Khu vực trong FDI",
          ],
        },
        fdi: {
          fdi,
          header: [
            "Vốn thực hiện FDI",
            "Đăng ký tăng thêm FDI",
            "Góp vốn, mua cổ phần FDI",
            "Đăng ký cấp mới FDI",
            "Vốn đăng ký FDI",
            "Số dự án cấp mới FDI",
            "Số dự án tăng vốn FDI",
          ],
        },
        vonDauTuNganSachNhaNuoc: {
          vonDauTuNganSachNhaNuoc: vonDauTuNganSachNhaNuoc?.map(
            (item, index) => ({
              ...item,
              tangTruongCungKy:
                (item?.von_nsnn_tong /
                  vonDauTuNganSachNhaNuoc[index - 12]?.von_nsnn_tong) *
                  100 -
                100,
            })
          ),
          header: [
            "Vốn NSNN Tổng",
            "Vốn NSNN Trung ương",
            "Vốn NSNN Bộ Y tế",
            "Vốn NSNN Bộ Giáo dục - Đào tạo",
            "Vốn NSNN Bộ Giao thông vận tải",
            "Vốn NSNN Bộ Giao thông vận tải",
            "Vốn NSNN Bộ NN và PTNT",
            "Vốn NSNN Bộ Tài nguyên và Môi trường",
            "Vốn NSNN Bộ Xây dựng",
            "Vốn NSNN Bộ Công thương",
            "Vốn NSNN Bộ Văn hóa, Thể thao và Du lịch",
            "Vốn NSNN Bộ Khoa học và Công nghệ",
            "Vốn NSNN Bộ Thông tin và Truyền thông",
            "Vốn NSNN Địa phương",
            "Vốn NSNN Vốn ngân sách NN cấp huyện",
            "Vốn NSNN Vốn ngân sách NN cấp xã",
            "Vốn NSNN Vốn ngân sách NN cấp tỉnh",
          ],
        },
        khoiLuongSanXuatCongNghiep: {
          khoiLuongSanXuatCongNghiep,
          header: [
            "SLSX Than đá (Than sạch)",
            "SLSX Khí đốt thiên nhiên dạng khí",
            "SLSX Khí hoá lỏng (LPG)",
            "SLSX Dầu mỏ thô khai thác",
            "SLSX Thuỷ hải sản chế biến",
            "SLSX Sữa bột",
            "SLSX Dầu thực vật tinh luyện",
            "SLSX Đường kính",
            "SLSX Bia",
            "SLSX Thuốc lá điếu",
            "SLSX Vải dệt từ sợi tự nhiên",
            "SLSX Vải dệt từ sợi tổng hợp hoặc sợi nhân tạo",
            "SLSX Quần áo mặc thường",
            "SLSX Giày thể thao",
            "SLSX Giày, dép da",
            "SLSX Giấy, bìa",
            "SLSX Phân hoá học",
            "SLSX Sơn hoá học",
            "SLSX Xà phòng giặt",
            "SLSX Lốp ô tô, máy kéo",
            "SLSX Kính thuỷ tinh",
            "SLSX Gạch xây bằng đất nung",
            "SLSX Gạch lát ceramic",
            "SLSX Xi măng",
            "SLSX Thép tròn",
            "SLSX Điều hoà nhiệt độ",
            "SLSX Tủ lạnh, tủ đá",
            "SLSX Tivi",
            "SLSX Máy giặt",
            "SLSX Xe tải",
            "SLSX Xe chở khách",
            "SLSX Xe máy",
            "SLSX Nước máy thương phẩm",
            "SLSX Điện sản xuất",
            "SLSX Biến thế điện",
            "SLSX Ô tô",
            "SLSX Thức ăn cho gia súc",
            "SLSX Xăng, dầu",
            "SLSX Alumin",
            "SLSX Sữa tươi",
            "SLSX Thức ăn cho thủy sản",
            "SLSX Bột ngọt",
            "SLSX Phân U rê",
            "SLSX Phân hỗn hợp N.P.K",
            "SLSX Sắt, thép thô",
            "SLSX Thép cán",
            "SLSX Thép thanh, thép góc",
            "SLSX Linh kiện điện thoại",
            "SLSX Dầu gội đầu, dầu xả",
            "SLSX Điện thoại di động",
            "SLSX Sữa tắm, sữa rửa mặt",
          ],
        },
        pmi: {
          pmi,
          header: ["PMI"],
        },
        iip: {
          iip,
          header: ["IIP"],
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

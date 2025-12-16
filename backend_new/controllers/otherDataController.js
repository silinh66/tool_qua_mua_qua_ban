// controllers/otherDataController.js
const queryMySQL = require("../utils/queryMySQL");
const cheerio = require("cheerio");
const axios = require("axios");
const moment = require("moment");

/**
 * Helper: chạy queryMySQL promise-based
 */
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. GET /gia_dien
 *    - Lấy dữ liệu từ bảng gia_dien
 */
exports.getElectricityPrices = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gia_dien ");
    res.send({ error: false, data: data, message: "gia_dien list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /financial_analysis
 *    - queryMySQL: symbol  (nếu thiếu → lỗi 400)
 *    - SELECT * FROM financial_analysis WHERE organCode = ?
 */
exports.getFinancialAnalysis = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL(
      "SELECT * FROM financial_analysis WHERE organCode = ?",
      [symbol]
    );
    res.send({ error: false, data: data, message: "financial_analysis list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET /giaVang
 *    - SELECT * FROM gold_price
 */
exports.getGoldPrices = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM gold_price ");
    res.send({ error: false, data: data, message: "giaVang list." });
  } catch (err) {
    next(err);
  }
};

exports.getGoldChartAll = async (req, res, next) => {
  try {
    // Nếu muốn filter theo company hoặc date, có thể đọc query params ở đây (tùy chọn).
    // Nhưng theo yêu cầu: "get all luôn" => trả toàn bộ dữ liệu.
    const sql =
      "SELECT * FROM gold_chart_chogia ORDER BY price_date DESC, company ASC";
    const data = await queryMySQL(sql);

    res.send({ error: false, data: data, message: "gold_chart_chogia list." });
  } catch (err) {
    next(err);
  }
};

exports.getLatestGoldPricesSimple = async (req, res, next) => {
  try {
    // optional query param to filter by company
    const companyFilter = req.query.company; // exact match

    // SQL: for each company pick the row with max(price_date)
    // then select company, buy, sell, price_date
    const sql = `
      SELECT g.company, g.buy, g.sell, DATE_FORMAT(g.price_date, '%Y-%m-%d') as price_date
      FROM gold_chart_chogia g
      INNER JOIN (
        SELECT company, MAX(price_date) AS max_date
        FROM gold_chart_chogia
        GROUP BY company
      ) t ON g.company = t.company AND g.price_date = t.max_date
      ${companyFilter ? "WHERE g.company = ?" : ""}
      ORDER BY g.company ASC
    `;

    const params = companyFilter ? [companyFilter] : [];
    // use runQuery helper that returns rows array (ensure your runQuery is the normalized one)
    const rows = await queryMySQL(sql, params);

    // map to desired shape
    const data = (Array.isArray(rows) ? rows : [rows]).map((r) => ({
      name: r.company,
      buy: r.buy !== null ? Number(r.buy) : null,
      sell: r.sell !== null ? Number(r.sell) : null,
      date: r.price_date, // YYYY-MM-DD
    }));

    res.send({ error: false, data, message: "latest gold prices" });
  } catch (err) {
    console.error("getLatestGoldPricesSimple error:", err);
    next(err);
  }
};

/**
 * 4. GET /lai_suat
 *    - SELECT * FROM lai_suat
 */
exports.getInterestRates = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM lai_suat ");
    res.send({ error: false, data: data, message: "lai_suat list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /news-all
 *    - SELECT * FROM news_all WHERE date = TODAY OR date = YESTERDAY
 */
exports.getNewsAll = async (req, res, next) => {
  try {
    let listPost = await queryMySQL(
      "SELECT * FROM news_all where (date = ? OR date = ?) ",
      [
        moment().format("YYYY-MM-DD"),
        moment().subtract(1, "days").format("YYYY-MM-DD"),
      ]
    );

    res.send({
      status: "success",
      data: listPost,
      length: listPost.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. GET /news-type
 *    - Lấy bài news theo type, hỗ trợ paging (limit, page)
 *    - Nếu type = "Bất động sản" | "Tài chính" | "Công nghệ" → dùng bảng news_all_detail
 */
exports.getNewsByType = async (req, res, next) => {
  try {
    const { type } = req.query;
    const limit = parseInt(req.query.limit, 12) || 12; // Giá trị mặc định là 10 bản ghi mỗi trang
    const page = parseInt(req.query.page, 10) || 1; // Mặc định là trang số 1
    let tableName = "news_all";
    console.log("type: ", type);
    if (type === "Bất động sản" || type === "Tài chính" || type === "Công nghệ")
      tableName = "news_all_detail";
    if (!type) {
      res.status(400).send("Type parameter is required");
      return;
    }

    const offset = (page - 1) * limit;

    const sqlQuery = `SELECT * FROM ${tableName} WHERE type = ? AND (date = ? OR date = ?) LIMIT ? OFFSET ? `;
    console.log("sqlQuery: ", sqlQuery);

    const listPostNewsType = await queryMySQL(
      sqlQuery,
      [
        type,
        moment().format("YYYY-MM-DD"),
        moment().subtract(30, "days").format("YYYY-MM-DD"),
        limit,
        offset,
      ],
      (error, results) => {
        if (error) {
          res.status(500).send("Error retrieving data");
          console.error(error);
          return;
        }
        res.json(results);
      }
    );
    res.send({
      status: "success",
      data: listPostNewsType,
      length: listPostNewsType?.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /lai_suat_online
 *    - SELECT * FROM lai_suat_online
 */
exports.getInterestRatesOnline = async (req, res, next) => {
  try {
    let data = await queryMySQL("SELECT * FROM lai_suat_online ");
    res.send({ error: false, data: data, message: "lai_suat_online list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /top_gdnn_rong_ban/:type
 *    - Gọi API extern, nếu lỗi fallback trả mảng rỗng
 */
exports.getTopNetForeignSell = async (req, res, next) => {
  try {
    let type = req.params.type;
    let data = await axios.get(
      `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=SALE&exchange=${
        type === "hose" ? "HSX" : "HNX"
      }&period=oneDay&numberOfItem=`
    );
    res.send({
      error: false,
      // data: [],
      data: data?.data?.result,
      message: "top_gdnn_rong_mua list.",
    });
  } catch (err) {
    // fallback nếu call extern lỗi
    return res.json({
      error: false,
      data: [],
      message: "top_gdnn_rong_ban list.",
    });
  }
};

/**
 * 9. GET /top_gdnn_rong_mua/:type
 *    - Gọi API extern, nếu lỗi fallback trả mảng rỗng
 */
exports.getTopNetForeignBuy = async (req, res, next) => {
  try {
    let type = req.params.type;
    let data = await axios.get(
      `https://fwtapi3.fialda.com/api/services/app/Stock/GetTopNetForeign?type=VALUE&side=BUY&exchange=${
        type === "hose" ? "HSX" : "HNX"
      }&period=oneDay&numberOfItem=`
    );
    res.send({
      error: false,
      // data: [],
      data: data?.data?.result,
      message: "top_gdnn_rong_mua list.",
    });
  } catch (err) {
    // fallback nếu call extern lỗi
    return res.json({
      error: false,
      data: [],
      message: "top_gdnn_rong_mua list.",
    });
  }
};

/**
 * 10. GET /reports
 *     - queryMySQL: symbol  (nếu thiếu → lỗi 400)
 *     - SELECT * FROM reports WHERE organCode = ?
 */
exports.getReportsBySymbol = async (req, res, next) => {
  try {
    let symbol = req?.query?.symbol;
    if (!symbol) {
      return res.send({ error: true, data: {}, message: "missing symbol" });
    }
    let data = await queryMySQL("SELECT * FROM reports WHERE organCode = ?", [
      symbol,
    ]);
    res.send({ error: false, data: data, message: "reports list." });
  } catch (err) {
    next(err);
  }
};

const getNewsDetail = async (url) => {
  // Fetch the HTML first and load it into Cheerio
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);
  let type;
  let title;
  let introduction;
  let date;
  let content;
  let sourceUrl;
  let follow;
  switch (true) {
    // Trường hợp URL là của báo Quân đội nhân dân
    case url.includes("https://www.qdnd.vn/"):
      // Lấy tiêu đề (title) từ thẻ h1
      title = $("h1.post-title").text().trim();

      // Lấy phần giới thiệu (introduction) từ thẻ h2 với class post-summary
      introduction = $("h2.logo-online").text().trim();

      // Lấy ngày đăng bài (date) từ phần chứa ngày giờ trong thẻ span
      date = $("span.post-subinfo")
        .text()
        .trim()
        .match(/\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/);
      date = date ? date[0] : "";

      // Clone nội dung bài viết (content) từ thẻ div có class là post-content
      var contentClone = $("div.post-content").clone(); // Sao chép nội dung bài viết
      contentClone.find("table, figure, .related-articles").remove(); // Loại bỏ các phần không cần thiết như bảng, hình ảnh
      content = contentClone.html(); // Lấy nội dung bài viết

      // URL gốc của bài viết
      sourceUrl = url;

      // Nguồn của bài viết
      follow = "Theo Báo Quân đội Nhân dân";

      break;

    case url.includes("https://doisongphapluat.com.vn/"):
      // Lấy tiêu đề từ thẻ <h1>
      title = $("h1.color-black.bold.fs-36").text().trim();

      // Lấy phần giới thiệu từ thẻ <h2> có class là sapo (nếu có)
      introduction = $("h2.fs-20.font-italic.color-black.word-space-1")
        .text()
        .trim();

      // Lấy ngày tháng từ phần <footer> hoặc nội dung văn bản có chứa ngày
      const fullDate = $("footer ul.ul-disc").text().trim();
      const dateMatch1 = fullDate.match(/\d{2}\/\d{2}\/\d{4}/);
      date = dateMatch1 ? dateMatch1[0] : "";

      // Clone phần nội dung bài viết và loại bỏ các quảng cáo hoặc nội dung không cần thiết
      var contentClone = $("div.entry-body, div.edittor-content").clone(); // Sao chép nội dung
      contentClone.find(".ads-item, .related-articles, .ad-690-220").remove(); // Loại bỏ quảng cáo và các phần không cần thiết
      content = contentClone.html();

      // URL gốc của bài viết
      sourceUrl = url;

      // Ghi rõ nguồn
      follow = "Theo Đời sống pháp luật";

      break;

    case url.includes("https://doanhnghiepkinhdoanh.doanhnhanvn.vn"):
      title = $("h2.title").text().trim();
      type = $("div.mb-3 a.badge.mr-2:first").text().trim();
      introduction = $("div.sapo").text().trim();
      const fullText = $("div.mb-3")
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim();
      const dateMatch = fullText.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      date = dateMatch ? dateMatch[0] : "";
      var contentClone = $("div.entry-body").clone(); // Sao chép nội dung để tránh thay đổi DOM gốc
      contentClone.find(".type-2 ").remove(); // Loại bỏ phần tử có class 'zone--related'
      content = contentClone.html();
      sourceUrl = url;
      follow = "Theo Doanh Nghiệp Kinh Doanh";
      break;

    case url.includes("https://baochinhphu.vn"):
      type = $("div.detail-breadcrumb a[data-role='cate-name']").text().trim();
      title = $("h1.detail-title").text().trim();
      const des = $("h2.detail-sapo").text().trim();
      introduction = des.replace("(Chinhphu.vn) - ", "");

      date = $("div.detail-time").text().trim();
      content = $("div.detail-content").html();
      sourceUrl = url;
      follow = "Theo Báo Chính Phủ";

      break;
    case url.includes("https://chatluongvacuocsong.vn"):
      title = $("h1.tit_detail").text().trim();

      const description = $("p.intro_detail").text().trim();
      introduction = description.replace("(CL&CS) - ", "");
      date = $("div.fs-14").text().trim();
      content = $("div.detail-content-clcs").html();
      type = $("span.section-title").html();
      sourceUrl = url;
      follow = "Theo Chất Lượng Cuộc Sống";
      break;
    case url.includes("https://doanhnhanvn.vn"):
      title = $("h1.detail__title").text().trim();
      introduction = $("div.detail__summary").text().trim();
      const dateTimeText = $("div.detail__time div").text();
      date = dateTimeText.match(/\d{2}:\d{2} \| \d{2}\/\d{2}\/\d{4}/)[0].trim();
      var contentClone = $("div.detail__content").clone(); // Sao chép nội dung để tránh thay đổi DOM gốc
      contentClone.find(".zone--related").remove(); // Loại bỏ phần tử có class 'zone--related'
      content = contentClone.html();
      type = $("div.detail__category a:last").text().trim();
      sourceUrl = url;
      follow = "Theo Doanh Nhân Việt Nam";
      break;
    default:
      console.log("URL not recognized");
      break;
  }

  // let hour = date?.slice(date?.length - 5, date?.length);
  let timeIndex = content?.indexOf(date);

  let contentSlice = content;
  if (timeIndex > -1) {
    contentSlice = contentSlice?.slice(timeIndex + 5, content?.length);
  }

  let thamKhaoThemIndex = contentSlice?.indexOf("Tham khảo thêm");
  let tinLienQuanIndex = contentSlice?.indexOf("Tin liên quan");

  if (thamKhaoThemIndex > -1) {
    contentSlice = contentSlice?.slice(0, thamKhaoThemIndex);
  }
  if (tinLienQuanIndex > -1) {
    contentSlice = contentSlice?.slice(0, tinLienQuanIndex);
  }

  return {
    type,
    title,
    date,
    introduction,
    content: contentSlice,
    sourceUrl,
    follow,
  };
};

exports.getNewsDetail = async (req, res, next) => {
  try {
    let url = req.body.url;
    console.log("url: ", url);
    let id = req.body.id;
    console.log("id: ", id);
    let detailNews = {};
    if (!url && !id) {
      return res.send({ error: true, data: {}, message: "missing url or id" });
    }
    if (!!id && id !== "null" && url !== undefined) {
      let detailQuery = await queryMySQL(
        "SELECT * FROM news_all_detail WHERE id = ?",
        [id]
      );
      detailNews = detailQuery?.length > 0 ? detailQuery[0] : {};
    } else {
      detailNews = await getNewsDetail(url);
    }
    if (Object.keys(detailNews).length === 0) {
      detailNews = await getNewsDetail(url);
    }
    console.log("detailNews: ", detailNews);
    res.send({ error: false, data: detailNews, message: "news detail." });
  } catch (err) {
    next(err);
  }
};

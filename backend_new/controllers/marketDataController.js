// controllers/marketDataController.js
const fs = require("fs");
const path = require("path");
const queryMySQL = require("../utils/queryMySQL");

const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment"); // chỉ dùng để convert ngày
const https = require("https");
const httpsAgent = new https.Agent({ family: 4 });

/**
 * Helper: chạy queryMySQL promise-based
 */
async function runQuery(sql, params = []) {
  const [rows] = await queryMySQL(sql, params);
  return rows;
}

/**
 * 1. PUT /iboard_detail/:id
 *    - Cập nhật một iboard_detail
 *    - Params: id = detailID
 *    - Body: { list_symbol }
 */
exports.updateIboardDetail = async (req, res, next) => {
  try {
    const { list_symbol } = req.body;
    const { id } = req.params;
    await queryMySQL("UPDATE iboard_detail SET list_symbol = ? WHERE id = ?", [
      list_symbol,
      id,
    ]);
    res.send({ success: true, message: "iboard_detail updated successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. DELETE /iboard_detail/:id
 *    - Xóa một iboard_detail
 *    - Params: id = detailID
 */
exports.deleteIboardDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    await queryMySQL("DELETE FROM iboard_detail WHERE id = ?", [id]);
    res.send({ success: true, message: "iboard_detail deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. GET /symbol_info
 *    - SELECT * FROM symbol_info; sau đó filter trên JS theo queryMySQL param `query`
 */
exports.getSymbolInfo = async (req, res, next) => {
  try {
    const symbol_query = req.query?.query;
    let listSymbolData = [];

    let response = await queryMySQL("SELECT * from symbol_info");

    listSymbolData = response;
    let listSymbolMap = listSymbolData.map((item) => {
      return {
        symbol: item?.symbol,
        full_name: item?.full_name,
        // description: ssiInfo?.companyNameVi,
        description: item?.description,
        exchange: item?.exchange,
        type: item?.type,
        exchange_logo: item?.exchange_logo,
      };
    });
    const filteredResults = listSymbolMap.filter((data) => {
      return data.symbol?.trim() == symbol_query?.trim();
    });
    return res.json(filteredResults);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. GET /stocks/iboard
 *    - Đọc file “iboard.json” trong cùng thư mục gốc (nếu tồn tại)
 */
exports.getStocksIboard = (req, res, next) => {
  try {
    let data = fs.readFileSync("iboard.json");
    let iboard = JSON.parse(data);
    res.send(iboard);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. GET /statistics/company/stock-price
 *    - Lấy bảng stock_price có pagination
 *    - queryMySQL params: symbol, page, pageSize, fromDate, toDate
 */
exports.getCompanyStockPrice = async (req, res, next) => {
  try {
    let { symbol, page, pageSize, fromDate, toDate } = req.query;

    // Convert dates to ISO format (yyyy-mm-dd)
    fromDate = convertDateToISO(fromDate);
    toDate = convertDateToISO(toDate);

    // Tính tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) AS total FROM stock_price
      WHERE symbol = ?
      AND DATE_FORMAT(STR_TO_DATE(tradingDate, '%d/%m/%Y %H:%i:%s'), '%Y-%m-%d') BETWEEN ? AND ?`;

    const totalRecords = await queryMySQL(countQuery, [
      symbol,
      fromDate,
      toDate,
    ]);
    const total = totalRecords[0].total;

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Prepare SQL queryMySQL for fetching data
    const queryStr = `
      SELECT * FROM stock_price
      WHERE symbol = ?
      AND DATE_FORMAT(STR_TO_DATE(tradingDate, '%d/%m/%Y %H:%i:%s'), '%Y-%m-%d') BETWEEN ? AND ?
      LIMIT ? OFFSET ?`;
    const results = await queryMySQL(queryStr, [
      symbol,
      fromDate,
      toDate,
      parseInt(pageSize),
      offset,
    ]);

    // Prepare pagination object
    const paging = {
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };

    res.json({
      code: "SUCCESS",
      message: "Get stock price data success",
      data: results,
      paging: paging,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. GET /bao_cao_phan_tich
 *    - queryMySQL param: symbol
 *    - SELECT * FROM bao_cao_phan_tich WHERE `code` = ?
 */
exports.getAnalysisReports = async (req, res, next) => {
  try {
    let symbol = req.query.symbol;
    let data = await queryMySQL(
      "SELECT * FROM bao_cao_phan_tich WHERE `code` = ?",
      [symbol]
    );
    res.send({
      error: false,
      data: data,
      message: "Báo cáo phân tích list.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /mua_ban_chu_dong
 *    - queryMySQL param: symbol
 *    - SELECT * FROM mua_ban_chu_dong WHERE symbol = ? ORDER BY Time DESC
 */
exports.getMuaBanChuDong = async (req, res, next) => {
  try {
    let symbol = req.query.symbol;

    // let latestDate = await getLatestDate();
    let data = await queryMySQL(
      "SELECT * FROM mua_ban_chu_dong WHERE symbol = ?  ORDER BY Time DESC",
      [symbol]
    );

    res.send({
      error: false,
      data: data,
      message: "mua_ban_chu_dong list.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /mua_ban_chu_dong_short
 *    - queryMySQL param: symbol
 *    - Gọi API extern Finpath: /trades và /orderbook, merge kết quả
 */
exports.getMuaBanChuDongShort = async (req, res, next) => {
  try {
    let symbol = req.query.symbol;
    let data = await axios.get(
      `https://api.finpath.vn/api/stocks/v2/trades/${symbol}?page=1&pageSize=3000`,
      { httpsAgent }
    );
    let dataResponse = data?.data?.data?.trades;

    let dataBidAsk = await axios.get(
      `https://api.finpath.vn/api/stocks/orderbook/${symbol}`,
      { httpsAgent }
    );
    let dataBidAskResponse = dataBidAsk?.data?.data?.orderbook;
    let dataResponseMap = dataResponse?.map((item, index) => {
      
      return {
        id: index,
        symbol: item?.c,
        High: item?.p,
        Low: item?.p,
        Close: item?.p,
        Open: item?.p,
        TradingDate: item?.td,
        Time: item?.t,
        Ceiling: 0,
        Floor: 0,
        RefPrice: item?.p - item?.ch,
        AvgPrice: item?.p,
        PriorVal: item?.p,
        LastPrice: item?.p,
        LastVol: item?.v,
        TotalVal: item?.accumulatedVal,
        TotalVol: item?.tv,
        TotalBuyVol: item?.tvb,
        TotalSellVol: item?.tvs,
        TotalOtherVol: item?.tvo,
        BidPrice1: dataBidAskResponse?.bids[0]?.price,
        BidPrice2: dataBidAskResponse?.bids[1]?.price,
        BidPrice3: dataBidAskResponse?.bids[2]?.price,
        BidPrice4: dataBidAskResponse?.bids[3]?.price,
        BidPrice5: dataBidAskResponse?.bids[4]?.price,
        BidPrice6: dataBidAskResponse?.bids[5]?.price,
        BidPrice7: dataBidAskResponse?.bids[6]?.price,
        BidPrice8: dataBidAskResponse?.bids[7]?.price,
        BidPrice9: dataBidAskResponse?.bids[8]?.price,
        BidPrice10: dataBidAskResponse?.bids[9]?.price,
        BidVol1: dataBidAskResponse?.bids[0]?.volume,
        BidVol2: dataBidAskResponse?.bids[1]?.volume,
        BidVol3: dataBidAskResponse?.bids[2]?.volume,
        BidVol4: dataBidAskResponse?.bids[3]?.volume,
        BidVol5: dataBidAskResponse?.bids[4]?.volume,
        BidVol6: dataBidAskResponse?.bids[5]?.volume,
        BidVol7: dataBidAskResponse?.bids[6]?.volume,
        BidVol8: dataBidAskResponse?.bids[7]?.volume,
        BidVol9: dataBidAskResponse?.bids[8]?.volume,
        BidVol10: dataBidAskResponse?.bids[9]?.volume,
        AskPrice1: dataBidAskResponse?.asks[0]?.price,
        AskPrice2: dataBidAskResponse?.asks[1]?.price,
        AskPrice3: dataBidAskResponse?.asks[2]?.price,
        AskPrice4: dataBidAskResponse?.asks[3]?.price,
        AskPrice5: dataBidAskResponse?.asks[4]?.price,
        AskPrice6: dataBidAskResponse?.asks[5]?.price,
        AskPrice7: dataBidAskResponse?.asks[6]?.price,
        AskPrice8: dataBidAskResponse?.asks[7]?.price,
        AskPrice9: dataBidAskResponse?.asks[8]?.price,
        AskPrice10: dataBidAskResponse?.asks[9]?.price,
        AskVol1: dataBidAskResponse?.asks[0]?.volume,
        AskVol2: dataBidAskResponse?.asks[1]?.volume,
        AskVol3: dataBidAskResponse?.asks[2]?.volume,
        AskVol4: dataBidAskResponse?.asks[3]?.volume,
        AskVol5: dataBidAskResponse?.asks[4]?.volume,
        AskVol6: dataBidAskResponse?.asks[5]?.volume,
        AskVol7: dataBidAskResponse?.asks[6]?.volume,
        AskVol8: dataBidAskResponse?.asks[7]?.volume,
        AskVol9: dataBidAskResponse?.asks[8]?.volume,
        AskVol10: dataBidAskResponse?.asks[9]?.volume,
        MarketId: "HOSE",
        Exchange: "HOSE",
        TradingSession: dataBidAskResponse?.tradingSession,
        TradingStatus: "N",
        Change: item?.ch,
        RatioChange: item?.chp,
        EstMatchedPrice: item?.p,
        type: item?.s === "buy" ? "B" : item?.s === "sell" ? "S" : "",
      };
    });
    let dataSorted = dataResponseMap.sort((a, b) => {
      const timeA = new Date("1970-01-01T" + a.Time);
      const timeB = new Date("1970-01-01T" + b.Time);
      return timeB - timeA;
    });
    res.send({
      error: false,
      data: dataSorted,
      message: "mua_ban_chu_dong list.",
    });
  } catch (err) {
    console.error("Error in mua_ban_chu_dong_short:", err);
    return res.json({}); // giống gốc: trả {} khi lỗi
  }
};

/**
 * 8.5. GET /indexes-overview
 *   - Gọi API extern:
 *      * https://api.finpath.vn/api/indexes/v2/overview
 */
exports.getIndexesOverview = async (req, res, next) => {
  try {
    let data = await fs.readFileSync(
      path.join(__dirname, "../indexes_overview.json"),
      "utf8"
    );
    let dataResponse = JSON.parse(data);

    res.send({
      error: false,
      data: dataResponse,
      message: "indexes-overview list.",
    });
  } catch (err) {
    console.error("Error in indexes-overview:", err);
    return res
      .status(500)
      .json({ error: true, message: "Failed to fetch indexes overview" });
  }
};

/**
 * 8.6. GET /propdata/:symbol
 *   - Gọi API extern:
 *      * https://api.finpath.vn/api/indexes/propdata/${symbol}/period
 *      * https://api.finpath.vn/api/stocks/roombars/${symbol}?type=10day
 */
exports.getPropdata = async (req, res, next) => {
  try {
    let symbol = req.params.symbol;
    let dataProp = await axios.get(
      `https://api.finpath.vn/api/indexes/propdata/${symbol}/period`,
      { httpsAgent }
    );
    let dataPropResponse = dataProp?.data?.data?.points;
    dataPropResponse = dataPropResponse?.map((item) => {
      return {
        ...item,
        netVal:
          item?.proprietaryTotalMatchBuyTradeValue -
          item?.proprietaryTotalMatchSellTradeValue,
      };
    });

    let dataRoom = await axios.get(
      `https://api.finpath.vn/api/stocks/roombars/${symbol}?type=10day`,
      { httpsAgent }
    );
    let dataRoomResponse = dataRoom?.data?.data?.bars;

    res.send({
      error: false,
      data: { propdata: dataPropResponse, roombars: dataRoomResponse },
      message: "propdata.",
    });
  } catch (err) {
    console.error("Error in propdata:", err);
    return res
      .status(500)
      .json({ error: true, message: "Failed to fetch propdata" });
  }
};

/**
 * 9. GET /world-indices
 *    - Crawl “https://investing.com/indices/world-indices” bằng cheerio
 *    - Lấy chỉ số: Dow Jones, Nasdaq, S&P 500, …, VNI, HNX, …
 */
exports.getWorldIndices = async (req, res, next) => {
  try {
    let response = await fetch("https://investing.com/indices/world-indices");
    let body = await response.text();
    let $ = cheerio.load(body);

    const indices = [
      "Dow Jones",
      "Nasdaq",
      "S&P 500",
      "Hang Seng",
      "Nikkei 225",
      "Shanghai",
      "DAX",
      "HNX30",
      "VN30",
      "VNI",
      "HNX",
      "VN100",
      "Euro Stoxx 50",
      "AEX",
      "IBEX 35",
      "FTSE MIB TR EUR",
      "SMI",
      "S&P/ASX 200",
    ];
    let data = [];

    $("table.genTbl.closedTbl.crossRatesTbl.elpTbl.elp30 tbody tr").each(
      (i, elem) => {
        let indexName = $(elem)
          .find("td.bold.left.noWrap.elp.plusIconTd a")
          .text()
          .trim();
        if (indices.includes(indexName)) {
          let id = $(elem).attr("id").replace("pair_", "");

          let lastIndex = $(`#pair_${id} .pid-${id}-last`).text().trim();
          let high = $(`#pair_${id} .pid-${id}-high`).text().trim();
          let low = $(`#pair_${id} .pid-${id}-low`).text().trim();
          let change = $(`#pair_${id} .pid-${id}-pc`).text().trim();
          let changePct = $(`#pair_${id} .pid-${id}-pcp`).text().trim();
          let time = $(`#pair_${id} .pid-${id}-time`).text().trim();

          data.push({
            name: indexName,
            value: lastIndex,
            high,
            low,
            change,
            percent: changePct,
            time,
            pid: id,
          });
        }
      }
    );
    res.send({ error: false, data: data, message: "world-indices list." });
  } catch (err) {
    console.error("Error in world-indices:", err);
    return res
      .status(500)
      .json({ error: true, message: "Failed to fetch world indices" });
  }
};

/**
 * 10. GET /goods-price
 *     - Crawl “https://investing.com/commodities/real-time-futures” bằng cheerio
 *     - Lấy các mặt hàng: Gold, Silver, Platinum, …, Live Cattle, Lumber, Oats, …
 */
exports.getGoodsPrice = async (req, res, next) => {
  try {
    let response = await fetch(
      "https://investing.com/commodities/real-time-futures"
    );
    let body = await response.text();
    let $ = cheerio.load(body);

    const indices = [
      "Gold",
      "XAU/USD",
      "Silver",
      "XAG/USD",
      "Platinum",
      "Palladium",
      "Crude Oil WTI",
      "Brent Oil",
      "Natural Gas",
      "Heating Oil",
      "Gasoline RBOB",
      "Aluminium",
      "Zinc",
      "Nickel",
      "Copper",
      "US Wheat",
      "Rough Rice",
      "US Corn",
      "Orange Juice",
      "Live Cattle",
      "Lean Hogs",
      "Feeder Cattle",
      "Lumber",
      "Oats",
    ];

    let data = [];

    $(".datatable_row__Hk3IV.dynamic-table_row__fdxP8").each((i, elem) => {
      let name = $(elem)
        .find(".datatable_cell--name__link__2xqgx")
        .text()
        .trim();
      if (indices.includes(name)) {
        let last = $(elem)
          .children(".datatable_cell--align-end__qgxDQ")
          .eq(1)
          .text()
          .trim();
        let high = $(elem)
          .children(".datatable_cell--align-end__qgxDQ")
          .eq(2)
          .text()
          .trim();
        let low = $(elem)
          .children(".datatable_cell--align-end__qgxDQ")
          .eq(3)
          .text()
          .trim();
        let change = $(elem)
          .children(".datatable_cell--align-end__qgxDQ")
          .eq(4)
          .text()
          .trim();
        let changePct = $(elem)
          .children(".datatable_cell--align-end__qgxDQ")
          .eq(5)
          .text()
          .trim();
        let time = $(elem)
          .find(".dynamic-table_timeWrapper__w9fFK time")
          .text()
          .trim();

        data.push({
          name,
          value: last,
          high,
          low,
          change,
          percent: changePct,
          time,
          pid: "",
        });
      }
    });
    res.send({
      error: false,
      data: [
        {
          name: "Vàng",
          value: "1,959.25",
          high: "1,965.50",
          low: "1,958.05",
          change: "-10.55",
          percent: "-0.54%",
          time: "16:44:45",
          pid: "8830",
        },
        {
          name: "XAU/USD",
          value: "1,954.71",
          high: "1,960.84",
          low: "1,953.59",
          change: "-3.89",
          percent: "-0.20%",
          time: "16:44:40",
          pid: "68",
        },
        {
          name: "Bạc",
          value: "22.622",
          high: "22.797",
          low: "22.610",
          change: "-0.283",
          percent: "-1.24%",
          time: "16:44:03",
          pid: "",
        },
        {
          name: "Đồng",
          value: "3.6168",
          high: "3.6448",
          low: "3.6123",
          change: "-0.0237",
          percent: "-0.65%",
          time: "16:44:08",
          pid: "",
        },
        {
          name: "Platin",
          value: "856.05",
          high: "864.70",
          low: "854.60",
          change: "-6.75",
          percent: "-0.78%",
          time: "16:43:36",
          pid: "",
        },
        {
          name: "Paladi",
          value: "961.78",
          high: "1,003.78",
          low: "951.03",
          change: "-47.32",
          percent: "-4.69%",
          time: "16:44:04",
          pid: "",
        },
        {
          name: "Dầu Thô WTI",
          value: "76.41",
          high: "76.44",
          low: "75.31",
          change: "+0.67",
          percent: "+0.88%",
          time: "16:45:02",
          pid: "8849",
        },
        {
          name: "Dầu Brent",
          value: "80.80",
          high: "81.48",
          low: "79.44",
          change: "+0.79",
          percent: "+0.99%",
          time: "16:43:45",
          pid: "",
        },
        {
          name: "Khí Tự nhiên",
          value: "3.042",
          high: "3.054",
          low: "3.003",
          change: "+0.001",
          percent: "+0.03%",
          time: "16:44:21",
          pid: "",
        },
        {
          name: "Dầu Nhiên liệu",
          value: "2.7540",
          high: "2.7540",
          low: "2.6989",
          change: "+0.0349",
          percent: "+1.28%",
          time: "16:43:45",
          pid: "",
        },
        {
          name: "Xăng RBOB",
          value: "2.1860",
          high: "2.1860",
          low: "2.1539",
          change: "+0.0252",
          percent: "+1.17%",
          time: "16:44:50",
          pid: "",
        },
        {
          name: "Nhôm",
          value: "2,228.00",
          high: "2,247.00",
          low: "2,225.50",
          change: "-14.50",
          percent: "-0.65%",
          time: "16:44:06",
          pid: "",
        },
        {
          name: "Kẽm",
          value: "2,607.00",
          high: "2,621.00",
          low: "2,587.50",
          change: "+4.50",
          percent: "+0.17%",
          time: "16:44:01",
          pid: "956470",
        },
        {
          name: "Ni-ken",
          value: "17,547.00",
          high: "17,686.00",
          low: "17,530.00",
          change: "-266.00",
          percent: "-1.49%",
          time: "16:43:51",
          pid: "",
        },
        {
          name: "Copper",
          value: "8,090.00",
          high: "8,142.00",
          low: "8,082.00",
          change: "-57.00",
          percent: "-0.70%",
          time: "16:43:45",
          pid: "959211",
        },
        {
          name: "Lúa mì Hoa Kỳ",
          value: "577.60",
          high: "581.88",
          low: "575.38",
          change: "-2.40",
          percent: "-0.41%",
          time: "16:43:38",
          pid: "",
        },
        {
          name: "Thóc",
          value: "16.440",
          high: "16.510",
          low: "16.440",
          change: "-0.075",
          percent: "-0.45%",
          time: "08:37:19",
          pid: "",
        },
        {
          name: "Bắp Hoa Kỳ",
          value: "467.88",
          high: "469.00",
          low: "467.12",
          change: "-0.12",
          percent: "-0.03%",
          time: "16:43:25",
          pid: "",
        },
        {
          name: "Nước Cam",
          value: "370.65",
          high: "371.85",
          low: "362.55",
          change: "+20.37",
          percent: "+5.82%",
          time: "02:00:04",
          pid: "",
        },
        {
          name: "Bê",
          value: "174.30",
          high: "180.07",
          low: "174.13",
          change: "-5.10",
          percent: "-2.84%",
          time: "02:04:59",
          pid: "",
        },
        {
          name: "Heo nạc",
          value: "71.47",
          high: "72.50",
          low: "71.10",
          change: "-0.03",
          percent: "-0.03%",
          time: "02:04:57",
          pid: "",
        },
        {
          name: "Bê đực non",
          value: "224.53",
          high: "240.18",
          low: "224.39",
          change: "-6.30",
          percent: "-2.73%",
          time: "04:46:03",
          pid: "",
        },
        {
          name: "Gỗ",
          value: "525.50",
          high: "525.50",
          low: "518.50",
          change: "+10.00",
          percent: "+1.94%",
          time: "03:44:37",
          pid: "",
        },
        {
          name: "Yến mạch",
          value: "350.50",
          high: "350.70",
          low: "348.30",
          change: "-0.20",
          percent: "-0.06%",
          time: "15:09:25",
          pid: "",
        },
      ],
      message: "goods-price list.",
    });
  } catch (err) {
    console.error("Error in goods-price:", err);
    return res
      .status(500)
      .json({ error: true, message: "Failed to fetch goods price" });
  }
};

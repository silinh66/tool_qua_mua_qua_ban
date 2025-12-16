// controllers/marketController.js
const axios = require("axios");
const config = {
  ApiUrl:
    process.env.MARKET_API_URL || "https://fc-data.ssi.com.vn/api/v2/Market/",
};
const moment = require("moment");
const { getAccessToken } = require("./_marketAuthHelper");
const MARKET_API_URL =
  process.env.MARKET_API_URL || "https://fc-data.ssi.com.vn/api/v2/Market/";
/**
 *  Hàm khởi tạo axios instance có header Authorization
 */
async function createMarketAxios() {
  const token = await getAccessToken();
  const instance = axios.create({
    baseURL: MARKET_API_URL,
    headers: {
      Authorization: token,
    },
  });
  return instance;
}

exports.getSecurities = async (req, res, next) => {
  try {
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 50;
    const client = await createMarketAxios();
    const url = `${config.ApiUrl}securities?lookupRequest.pageIndex=${pageIndex}&lookupRequest.pageSize=${pageSize}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getSecuritiesDetails = async (req, res, next) => {
  try {
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 50;
    const client = await createMarketAxios();
    const url = `${config.ApiUrl}SecuritiesDetails?lookupRequest.pageIndex=${pageIndex}&lookupRequest.pageSize=${pageSize}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getIndexComponents = async (req, res, next) => {
  try {
    const indexCode = req.query.indexCode || "";
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 1000;
    const client = await createMarketAxios();
    const url = `${config.ApiUrl}IndexComponents?lookupRequest.pageIndex=${pageIndex}&lookupRequest.pageSize=${pageSize}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getIndexList = async (req, res, next) => {
  try {
    const exchange = req.query.exchange || "HOSE";
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 1000;
    const client = await createMarketAxios();
    const url = `${
      config.ApiUrl
    }IndexList?lookupRequest.exchange=${encodeURIComponent(
      exchange
    )}&lookupRequest.pageIndex=${pageIndex}&lookupRequest.pageSize=${pageSize}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getDailyOhlc = async (req, res, next) => {
  try {
    const { symbol, fromDate, toDate } = req.query;
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 1000;
    const ascending = req.query.ascending === "true";

    if (!symbol || !fromDate || !toDate) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    // format ngày sang đúng định dạng API (dd/MM/yyyy)
    const from = moment(fromDate, "YYYY-MM-DD").format("DD/MM/YYYY");
    const to = moment(toDate, "YYYY-MM-DD").format("DD/MM/YYYY");
    const client = await createMarketAxios();
    const url = `${config.ApiUrl}DailyOhlc?lookupRequest.symbol=${symbol}&lookupRequest.fromDate=${from}&lookupRequest.toDate=${to}&lookupRequest.pageIndex=${pageIndex}&lookupRequest.pageSize=${pageSize}&lookupRequest.ascending=${ascending}`;
    console.log("url: ", url);
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

/**
 * 11. GET /market/IntradayOhlc
 */
exports.getIntradayOhlc = async (req, res, next) => {
  try {
    const { symbol, fromDate, toDate } = req.query;
    const pageIndex = req.query.pageIndex || 1;
    const pageSize = req.query.pageSize || 5000;
    const ascending = req.query.ascending === "true";

    if (!symbol || !fromDate || !toDate) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const from = moment(fromDate, "YYYY-MM-DD").format("DD/MM/YYYY");
    const to = moment(toDate, "YYYY-MM-DD").format("DD/MM/YYYY");

    const client = await createMarketAxios();
    const url = `securities/${encodeURIComponent(
      symbol
    )}/intraday-prices?from_date=${from}&to_date=${to}&page_index=${pageIndex}&page_size=${pageSize}&ascending=${ascending}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

/**
 * 12. GET /market/DailyIndex
 *     - main.js mã gốc cố định indexId="HNX30", fromDate="20/01/2021", toDate="27/01/2021".
 *     - Ở đây, mình sẽ cho phép override qua query (nếu muốn), mặc định gốc sẽ sử dụng giá trị cứng.
 */
exports.getDailyIndex = async (req, res, next) => {
  try {
    let indexId = req.query.indexId || "HNX30";
    let from = req.query.fromDate || "20/01/2021";
    let to = req.query.toDate || "27/01/2021";
    // pageIndex & pageSize của main.js là cố định 1 và 1000, ascending không dùng
    const pageIndex = 1;
    const pageSize = 1000;

    const client = await createMarketAxios();
    const url = `indexes/${encodeURIComponent(
      indexId
    )}/prices?from_date=${encodeURIComponent(
      from
    )}&to_date=${encodeURIComponent(
      to
    )}&page_index=${pageIndex}&page_size=${pageSize}`;
    const response = await client.get(url);
    return res.json(response.data);
  } catch (err) {
    next(err);
  }
};

/**
 * 13. GET /market/DailyStockPrice
 */
exports.getDailyStockPrice = async (req, res, next) => {
  try {
    const { symbol, fromDate, toDate } = req.query;
    let lookupRequest = {};
    lookupRequest.symbol = symbol;
    lookupRequest.market = "";
    lookupRequest.fromDate = fromDate;
    lookupRequest.toDate = toDate;
    lookupRequest.pageIndex = 1;
    lookupRequest.pageSize = 1000;

    axios
      .get(
        MARKET_API_URL +
          "DailyStockPrice" +
          "?lookupRequest.symbol=" +
          lookupRequest.symbol +
          "&lookupRequest.fromDate=" +
          lookupRequest.fromDate +
          "&lookupRequest.toDate=" +
          lookupRequest.toDate +
          "&lookupRequest.pageIndex=" +
          lookupRequest.pageIndex +
          "&lookupRequest.pageSize=" +
          lookupRequest.pageSize +
          "&lookupRequest.market=" +
          lookupRequest.market
      )
      .then((response) => {
        res.send(JSON.parse(JSON.stringify(response.data)));
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (err) {
    next(err);
  }
};

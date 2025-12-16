// controllers/dataFeedController.js
const axios = require("axios");
const queryMySQL = require("../utils/queryMySQL");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
const cheerio = require("cheerio");

exports.getHistory = async (req, res, next) => {
  try {
    const { symbol, resolution, from, to, countback } = req.query;

    if (!symbol || !resolution || !from || !to || !countback) {
      return res.status(400).json({ error: "Missing required parameters." });
    }
    if (symbol === "GC=F") {
      let resolutionType = resolution === "1D" ? "D" : "1";
      let query = `https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=${resolutionType}&from=${from}&to=${to}`;
      const client = new ZenRows("c774641bbd0fb41b3489ef7ebc18bc1859eca0c4");
      const url =
        "https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=1&from=1697431278&to=1697517738";

      try {
        const { data } = await client.get(url, {});
        let dataMap = {
          c: data.c.map((item) => +item.toFixed(2)),
          h: data.h.map((item) => +item.toFixed(2)),
          l: data.l.map((item) => +item.toFixed(2)),
          o: data.o.map((item) => +item.toFixed(2)),
          s: "ok",
          t: data.t,
          v: data.v.map((item) => 1000),
        };
        res.json(dataMap);
      } catch (error) {
        console.error(error.message);
        if (error.response) {
          console.error(error.response.data);
        }
      }
      return;
    }
    if (symbol === "GC=F") {
      console.log("aaaaaaaaaa");
      let resolutionType = resolution === "1D" ? "D" : "1";
      let query = `https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=${resolutionType}&from=${from}&to=${to}`;
      const client = new ZenRows("c774641bbd0fb41b3489ef7ebc18bc1859eca0c4");
      const url =
        "https://tvc6.investing.com/ba45a903612b1e02d9718e41931be53b/1697517631/52/52/110/history?symbol=8830&resolution=1&from=1697431278&to=1697517738";

      try {
        const { data } = await client.get(url, {});
        let dataMap = {
          c: data.c.map((item) => +item.toFixed(2)),
          h: data.h.map((item) => +item.toFixed(2)),
          l: data.l.map((item) => +item.toFixed(2)),
          o: data.o.map((item) => +item.toFixed(2)),
          s: "ok",
          t: data.t,
          v: data.v.map((item) => 1000),
        };
        res.json(dataMap);
      } catch (error) {
        console.error(error.message);
        if (error.response) {
          console.error(error.response.data);
        }
      }
      return;
    }
    let resolutionType = resolution === "1D" ? "D" : "1";
    let query = `https://dchart-api.vndirect.com.vn/dchart/history?symbol=${symbol}&resolution=${resolutionType}&from=${from}&to=${to}`;
    let listSymbolData = await axios.get(query);
    const filteredData = {
      t: [],
      c: [],
      o: [],
      h: [],
      l: [],
      v: [],
      s: "ok",
    };
    let data = listSymbolData.data;
    // for (let i = 0; i < data.v.length; i++) {
    //   if (data.v[i] !== 0) {
    //     filteredData.t.push(data.t[i]);
    //     filteredData.c.push(data.c[i]);
    //     filteredData.o.push(data.o[i]);
    //     filteredData.h.push(data.h[i]);
    //     filteredData.l.push(data.l[i]);
    //     filteredData.v.push(data.v[i]);
    //   }
    // }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { limit, query } = req.query;
    let listSymbol = await axios.get(
      `https://dchart-api.vndirect.com.vn/dchart/search?limit=${limit}&query=${query}&type=&exchange=`
    );
    return res.json(listSymbol.data);
  } catch (err) {
    next(err);
  }
};

exports.getSymbols = async (req, res, next) => {
  try {
    const symbol = req.query.symbol;
    let listSymbolData = [];
    let response = await queryMySQL("SELECT * from symbol_info");

    listSymbolData = response;
    let listSymbolMap = listSymbolData.map((item) => {
      return {
        name: item?.symbol,
        "exchange-traded": item?.exchange,
        "exchange-listed": item?.exchange,
        timezone: "Asia/Ho_Chi_Minh",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "24x7",
        has_intraday: true,
        visible_plots_set: "ohlcv",
        // description: ssiInfo?.companyNameVi,
        description: item?.description,
        type: "Cổ phiếu",
        supported_resolutions: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "10",
          "15",
          "20",
          "25",
          "30",
          "45",
          "90",
          "1h",
          "2h",
          "3h",
          "4h",
          "D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "3M",
          "6M",
          "12M",
        ],
        pricescale: 100,
        ticker: item?.Symbol,
        logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
        exchange_logo: item?.exchange_logo,
      };
    });
    let pickedSymbol;
    pickedSymbol = listSymbolMap.find((item) => item.name === symbol);
    if (!pickedSymbol) {
      pickedSymbol = {
        name: symbol,
        "exchange-traded": "HOSE",
        "exchange-listed": "HOSE",
        timezone: "Asia/Ho_Chi_Minh",
        minmov: 1,
        minmov2: 0,
        pointvalue: 1,
        session: "24x7",
        has_intraday: true,
        visible_plots_set: "ohlcv",
        // description: ssiInfo?.companyNameVi,
        description: symbol,
        type: "Chỉ số",
        supported_resolutions: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "10",
          "15",
          "20",
          "25",
          "30",
          "45",
          "90",
          "1h",
          "2h",
          "3h",
          "4h",
          "D",
          "2D",
          "3D",
          "W",
          "2W",
          "M",
          "3M",
          "6M",
          "12M",
        ],
        pricescale: 100,
        ticker: symbol,
        logo_urls: ["https://s3-symbol-logo.tradingview.com/apple.svg"],
        exchange_logo: "https://s3-symbol-logo.tradingview.com/country/US.svg",
      };
    }
    if (!!pickedSymbol) {
      res.json(pickedSymbol);
    } else {
      res.status(404).json({
        error: "Symbol not found",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getConfig = (req, res) => {
  res.json({
    supports_search: true,
    supports_group_request: false,
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true,
    exchanges: [
      {
        value: "",
        name: "All Exchanges",
        desc: "",
      },
      {
        value: "HSX",
        name: "Sàn giao dịch chứng khoán TP HCM",
        desc: "HSX",
      },
      {
        value: "NYMEX",
        name: "Sàn NYMEX",
        desc: "NYMEX",
      },
      {
        value: "HNX",
        name: "Sàn giao dịch chứng khoán Hà Nội",
        desc: "HNX",
      },
      {
        value: "COMEX",
        name: "Sàn COMEX",
        desc: "COMEX",
      },
      {
        value: "UPCOM",
        name: "Sàn giao dịch chứng khoán UPCOM",
        desc: "UPCOM",
      },
      {
        value: "ICEUS",
        name: "Sàn ICEUS",
        desc: "ICEUS",
      },
      {
        value: "CBOT",
        name: "Sàn CBOT",
        desc: "CBOT",
      },
      {
        value: "WORLD",
        name: "Sàn thế giới",
        desc: "WORLD",
      },
    ],
    symbols_types: [
      {
        name: "Tất cả",
        value: "",
      },
      {
        name: "Cổ phiếu",
        value: "stock",
      },
      {
        name: "Index",
        value: "index",
      },
    ],
    supported_resolutions: [
      "1",
      "2",
      "3",
      "4",
      "5",
      "10",
      "15",
      "20",
      "25",
      "30",
      "45",
      "90",
      "1h",
      "2h",
      "3h",
      "4h",
      "D",
      "2D",
      "3D",
      "W",
      "2W",
      "M",
      "3M",
      "6M",
      "12M",
    ],
  });
};

exports.getTime = (req, res) => {
  const serverTime = Math.floor(Date.now() / 1000);
  res.send(serverTime.toString());
};

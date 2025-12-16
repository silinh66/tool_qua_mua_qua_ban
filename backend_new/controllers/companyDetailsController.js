// controllers/companyDetailsController.js
const queryMySQL = require("../utils/queryMySQL");

const axios = require("axios");
const moment = require("moment");

/**
 * 6. POST /filter-data
 *    - Filter full: gọi API extern “GetDataByFilter” và trả về kết quả
 *    - Body: object (truyền nguyên request body)
 */
exports.filterDataFull = async (req, res, next) => {
  try {
    let object = req.body;
    let dataResponse = await axios.post(
      // "https://dautubenvung-721299848503.us-central1.run.app/filter-data",
      // "https://fwtapi1.fialda.com/api/services/app/Stock/GetDataByFilter",
      "https://fwtapi3.fialda.com/api/services/app/Stock/GetDataByFilter",
      object
    );
    console.log("dataResponse: ", dataResponse?.data);

    // let data = dataResponse?.data;
    let data = dataResponse?.data;
    res.send({ error: false, data: data, message: "filter list." });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. POST /filter-data-new
 *    - Filter mới: gọi API extern “GetScreenerItems” và trả về kết quả
 *    - Body: object (truyền nguyên request body)
 */
exports.filterDataNew = async (req, res, next) => {
  try {
    let object = req.body;
    let objectStringify = JSON.stringify(object);
    let response = await fetch(
      "https://fiin-tools.ssi.com.vn/Screener/GetScreenerItems",
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "x-fiin-key": "KEY",
          "x-fiin-seed": "SEED",
          "x-fiin-user-id": "ID",
          "x-fiin-user-token":
            "131,86,205,104,139,11,97,119,219,172,158,59,231,70,153,222,34,251,171,147,197,227,151,118,92,135,193,174,198,15,238,19,187,170,180,60,149,92,123,58,238,241,205,171,32,172,220,51,49,3,50,155,236,103,206,123,26,1,176,114,226,16,50,48,232,125,17,77,205,211,19,186,54,61,178,230,62,179,208,210,135,188,175,172,46,206,49,176,237,225,152,193,42,178,82,133,252,84,32,250,243,227,183,115,239,155,44,161,179,130,190,150,20,133,134,244,36,233,47,75,150,153,76,177,156,23,25,165,192,111,89,112,44,99,193,6,174,66,185,244,128,184,63,207,61,190,114,155,79,245,236,197,85,254,104,9,58,163,90,35,93,218,247,35,248,94,176,42,228,10,70,185,236,143,211,104,39,152,45,234,215,34,167,30,128,228,211,149,80,224,45,57,95,240,41,128,141,228,76,38,81,187,125,47,49,169,9,147,16,81,101,69,239,5,194,72,84,60,75,36,225,211,127,178,112,235,196,90,63,78,127,209,103,31,103,180,95,14,128,144,129,64,89,226,39,25,84,158,184,20,51,54,25,179,159,217",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: objectStringify,
        method: "POST",
      }
    );
    let data = await response.json();
    let dataFilter = data?.items;
    res.send({
      error: false,
      // data: [],
      data,
      message: "filter list.",
    });
  } catch (err) {
    next(err);
  }
};

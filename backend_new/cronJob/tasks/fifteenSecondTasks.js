// tasks/fifteenSecondTasks.js
const axios = require("axios");
const saveDataToDatabase = require("../../utils/saveDataToDatabase");
const { buildApiUrl } = require("../../utils/buildApiUrl");
const { getDateAdjustment } = require("../../utils/getDateAdjustment");
const queryMySQL = require("../../utils/queryMySQL");

async function getIndexPointHOSE() {
  console.log("[getIndexPointHOSE] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/leaderlarger?index=VNINDEX`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;
    // Sắp xếp mảng theo giá trị tuyệt đối của point từ lớn đến nhỏ
    // Tách mảng thành 2 phần: giá trị dương và giá trị âm
    let positivePoints = response
      ?.filter((item) => item.point > 0)
      .sort((a, b) => b.point - a.point);
    let negativePoints = response
      ?.filter((item) => item.point < 0)
      .sort((a, b) => a.point - b.point);

    // Lấy 10 giá trị dương lớn nhất và 10 giá trị âm bé nhất
    let top10Positive = positivePoints?.slice(0, 10);
    let top10Negative = negativePoints?.slice(0, 10);

    // Kết hợp 2 mảng lại với nhau
    let result = top10Positive?.concat(top10Negative);

    let dataMap = result?.map((item) => {
      return [...Object.values(item)];
    });

    if (dataMap?.length > 0) {
      //delete old data
      await queryMySQL("DELETE FROM top20_hose");
      //insert new data
      await queryMySQL("INSERT INTO top20_hose VALUES ?", [dataMap]);
    }
    // else {
    //   //delete old data
    //   await queryMySQL("DELETE FROM top20_hose");
    // }
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getIndexPointHNX() {
  console.log("[getIndexPointHNX] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/leaderlarger?index=HNX`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;
    // Sắp xếp mảng theo giá trị tuyệt đối của point từ lớn đến nhỏ
    // Tách mảng thành 2 phần: giá trị dương và giá trị âm
    let positivePoints = response
      ?.filter((item) => item.point > 0)
      .sort((a, b) => b.point - a.point);
    let negativePoints = response
      ?.filter((item) => item.point < 0)
      .sort((a, b) => a.point - b.point);

    // Lấy 10 giá trị dương lớn nhất và 10 giá trị âm bé nhất
    let top10Positive = positivePoints?.slice(0, 10);
    let top10Negative = negativePoints?.slice(0, 10);

    // Kết hợp 2 mảng lại với nhau
    let result = top10Positive?.concat(top10Negative);

    let dataMap = result?.map((item) => {
      return [...Object.values(item)];
    });

    if (dataMap?.length > 0) {
      //delete old data
      await queryMySQL("DELETE FROM top20_hnx");
      //insert new data
      await queryMySQL("INSERT INTO top20_hnx VALUES ?", [dataMap]);
    }
    // else {
    //   //delete old data
    //   await queryMySQL("DELETE FROM top20_hose");
    // }
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getNuocNgoai() {
  console.log("[getNuocNgoai] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://api-finfo.vndirect.com.vn/v4/foreigns?q=code:STOCK_HNX,STOCK_UPCOM,STOCK_HOSE,ETF_HOSE,IFC_HOSE&sort=tradingDate&size=100`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;

    let lastPrices = response?.slice(0, 5);

    let dataMap = lastPrices?.map((item) => {
      return [...Object.values(item)];
    });
    //delete old data
    await queryMySQL("DELETE FROM nuoc_ngoai");
    //insert new data
    await queryMySQL("INSERT INTO nuoc_ngoai VALUES ?", [dataMap]);
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getTuDoanhRong() {
  console.log("[getTuDoanhRong] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://api-finfo.vndirect.com.vn/v4/proprietary_trading?q=code:HNX,VNINDEX,UPCOM&sort=date:desc&size=600`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;

    let dataMap = response?.map((item) => {
      return [null, ...Object.values(item)];
    });
    //delete old data
    await queryMySQL("DELETE FROM tu_doanh_all");
    //insert new data
    await queryMySQL(
      "INSERT INTO tu_doanh_all (id, code, type, floor, date,buyingVol, buyingVolPct, sellingVol, sellingVolPct, buyingVal, buyingValPct, sellingVal, sellingValPct, netVal, netVol ) VALUES ?",
      [dataMap]
    );
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getNuocNgoaiMuaRong() {
  console.log("[getNuocNgoaiMuaRong] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://api-finfo.vndirect.com.vn/v4/foreigns?q=code:STOCK_HNX,STOCK_UPCOM,STOCK_HOSE,ETF_HOSE,IFC_HOSE&sort=tradingDate&size=100`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;

    let dataMap = response?.map((item) => {
      return [...Object.values(item)];
    });
    //delete old data
    await queryMySQL("DELETE FROM nuoc_ngoai_all");
    //insert new data
    await queryMySQL("INSERT INTO nuoc_ngoai_all VALUES ?", [dataMap]);
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getChangeCount() {
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/gainerslosers?index=VNINDEX`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;
    let lastItem =
      response?.length > 0
        ? response[response.length - 1]
        : {
            index: "VNINDEX",
            noChange: 0,
            decline: 0,
            advance: 0,
            time: "09:10:10",
          };
    const apiResponseHNX = await axios.get(
      `https://mkw-socket-v2.vndirect.com.vn/mkwsocketv2/gainerslosers?index=HNX`
    ); // Your HTML response goes here
    const responseHNX = apiResponseHNX?.data?.data;
    let lastItemHNX =
      responseHNX?.length > 0
        ? responseHNX[responseHNX.length - 1]
        : {
            index: "HNX",
            noChange: 0,
            decline: 0,
            advance: 0,
            time: "09:10:10",
          };

    let result = [lastItem, lastItemHNX];

    let dataMap = result.map((item) => {
      return [...Object.values(item)];
    });
    //delete old data
    await queryMySQL("DELETE FROM change_count");
    //insert new data
    await queryMySQL("INSERT INTO change_count VALUES ?", [dataMap]);
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getGiaVangNew() {
  console.log("[getGiaVangNew] Executed");
  try {
    // Simulate API response
    const apiResponse = await axios.get(
      `https://api2.giavang.net/v1/gold/last-price?codes[]=XAUUSD&codes[]=USDX&codes[]=SJL1L10&codes[]=SJHN&codes[]=SJDNG&codes[]=DOHNL&codes[]=DOHCML&codes[]=BTSJC&codes[]=PQHNVM&codes[]=VNGSJC&codes[]=VIETTINMSJC&codes[]=VNGN&codes[]=HANAGOLD&codes[]=BT9999NTT&codes[]=PQHN24NTT&codes[]=DOJINHTV`
    ); // Your HTML response goes here
    const response = apiResponse?.data?.data;

    const listDataMap = response?.map((item, index) => {
      return [
        {
          id: item?.id,
          type_code: item?.type_code,
          type: item?.type,
          sell: item?.sell,
          buy: item?.buy,
          open_sell: item?.open_sell,
          open_buy: item?.open_buy,
          alter_sell: item?.alter_sell,
          sell_min: item?.sell_min,
          sell_max: item?.sell_max,
          alter_buy: item?.alter_buy,
          buy_min: item?.buy_min,
          buy_max: item?.buy_max,
          sell_avg: item?.sell_avg,
          buy_avg: item?.buy_avg,
          yesterday_sell: item?.yesterday_sell,
          yesterday_buy: item?.yesterday_buy,
          count_sell: item?.count_sell,
          count_buy: item?.count_buy,
          update_time: item?.update_time,
          create_day: item?.create_day,
          create_month: item?.create_month,
          create_year: item?.create_year,
        },
        ...item?.histories?.map((item, index) => {
          return {
            ...item,
            yesterday_buy: null,
          };
        }),
      ];
    });
    let dataMap = [].concat(...listDataMap);

    const queryString = `
  INSERT INTO gold_price (
    id, type_code, type, sell, buy, open_sell, open_buy, alter_sell,
    sell_min, sell_max, alter_buy, buy_min, buy_max, sell_avg, buy_avg,
    yesterday_sell, yesterday_buy, count_sell, count_buy, update_time,
    create_day, create_month, create_year
  ) VALUES ?`;

    // Preparing the values for batch insert
    const values = dataMap.map((item) => [
      item.id,
      item.type_code,
      item.type,
      item.sell,
      item.buy,
      item.open_sell,
      item.open_buy,
      item.alter_sell,
      item.sell_min,
      item.sell_max,
      item.alter_buy,
      item.buy_min,
      item.buy_max,
      item.sell_avg,
      item.buy_avg,
      item.yesterday_sell,
      item.yesterday_buy,
      item.count_sell,
      item.count_buy,
      item.update_time,
      item.create_day,
      item.create_month,
      item.create_year,
    ]);

    if (values?.length > 0) {
      //delete old data
      await queryMySQL("DELETE FROM gold_price");
      // Executing the batch insert
      await queryMySQL(queryString, [values]);
      // console.log("Update gold price successfully");
    }
  } catch (error) {
    console.log("error gold price: ", error);
  }
}

async function fetchThanhKhoanData(type, historical = false) {
  console.log(`[fetchThanhKhoanData (${type}-${historical})] Executed`);
  const indexCode = type === "hose" ? "VNINDEX" : "HNX";
  const dateAdjustment = getDateAdjustment(historical);
  const url = buildApiUrl(indexCode, dateAdjustment, historical);

  try {
    const response = await axios.get(url);
    const data = response.data.data;
    if (data && data.length > 0) {
      await saveDataToDatabase(data, type, historical);
    }
  } catch (error) {
    console.error(
      "Failed to fetch or save liquidity data for",
      type,
      ":",
      error
    );
  }
}

module.exports = {
  getIndexPointHOSE,
  getIndexPointHNX,
  getNuocNgoai,
  getTuDoanhRong,
  getNuocNgoaiMuaRong,
  getChangeCount,
  getGiaVangNew,
  fetchThanhKhoanData,
};

// tasks/dailyTasks.js
const axios = require("axios");
const queryMySQL = require("../../utils/queryMySQL");

const getNews = async (symbol) => {
  let curDay = new Date().toISOString().split("T")[0];
  let curDateSTring = curDay.split("-")[2];
  let curMonthString = curDay.split("-")[1];
  let curYearString = curDay.split("-")[0];
  try {
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/news?symbol=${symbol}&pageSize=100&page=1&fromDate=11%2F11%2F2022&toDate=${curDateSTring}%2F${curMonthString}%2F${curYearString}&language=vn`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiJiMjhkZDljNC0zYjQ5LTRlNmQtYjdlMC1kOTk0MWRhOTM5YzIiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzAwNzEyMDM5LCJleHAiOjE3MDA3NDA4Mzl9.DUoJ61Tc7bs0CJ1KBxC219fM7AbpG9VjoC5Kxelr6Kw",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiMWNhNjk2NjA3Njg2ODQ3NSIsInRyIjoiYzYyZjg3YjVjYjg5Mzc2NjQ3MzZiNWIxMjA0OTUyMDAiLCJ0aSI6MTcwMDcyMzE5NTAwNn19",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-c62f87b5cb8937664736b5b120495200-1ca6966076868475-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-1ca6966076868475----1700723195006",
          Referer: "https://iboard.ssi.com.vn/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          // await queryMySQL("INSERT INTO news VALUES ?", [dataNewsMap]);
          //delete news where symbol = symbol then insert new news
          await queryMySQL("DELETE FROM news WHERE symbol = ?", [symbol]);
          await queryMySQL("INSERT INTO news VALUES ?", [dataNewsMap]);

          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getThongKeGiaoDich = async (symbol) => {
  try {
    let todayString = moment().format("DD%2FMM%2FYYYY");

    let twoYearsAgoDate = moment()
      .subtract(2, "years")
      .format("DD%2FMM%2FYYYY");
    const response = await fetch(
      `https://iboard-api.ssi.com.vn/statistics/company/stock-price?symbol=SSI&page=1&pageSize=300&fromDate=${twoYearsAgoDate}&toDate=${todayString}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "vi",
          authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjIzMzcxOCIsInV1aWQiOiI4YzMxYmQyZS1mNDQ5LTQwMTMtYWRkZC1lMzAwNjBlYjVhYTgiLCJjaGFubmVsIjoid2ViIiwic3lzdGVtVHlwZSI6Imlib2FyZCIsInZlcnNpb24iOiIyIiwiaWF0IjoxNzA1Mjg1NTQwLCJleHAiOjE3MDUzMTQzNDB9.S-jh2QShmoEL6Wcowj493e653BwkibubRntwvKcp1is",
          "device-id": "EE427A40-1C39-49A7-AB99-7A25A2829BDD",
          "if-none-match": 'W/"238f-9kF50U6kZ7yAkc2GPYGVIYYd2RM"',
          newrelic:
            "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjM5NjY4NDAiLCJhcCI6IjU5NDQzMzA3MiIsImlkIjoiZTE2ZWRiODRiNzRmYmY0MCIsInRyIjoiMGI0YjEzNmE0MTVjNzQ3OWY1Y2UwOWQ1MjZkNWVmMDAiLCJ0aSI6MTcwNTI4NjQ4ODE2N319",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          traceparent:
            "00-0b4b136a415c7479f5ce09d526d5ef00-e16edb84b74fbf40-01",
          tracestate:
            "3966840@nr=0-1-3966840-594433072-e16edb84b74fbf40----1705286488167",
          Referer: "https://iboard.ssi.com.vn/",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.body instanceof zlib.Gunzip) {
      const gunzipStream = response.body;

      // Tạo một readable stream từ gunzip stream
      const readableStream = new Readable().wrap(gunzipStream);

      let data = "";
      readableStream.on("data", (chunk) => {
        data += chunk;
      });

      readableStream.on("end", async () => {
        try {
          // Chuyển đổi dữ liệu đã giải nén thành chuỗi
          const decompressedString = data.toString();

          // Chuyển chuỗi JSON thành đối tượng
          const jsonObject = JSON.parse(decompressedString);

          // Sử dụng đối tượng jsonObject ở đây
          if (!jsonObject) return;

          let dataNews = jsonObject?.data;
          if (!dataNews) return;
          if (dataNews?.length === 0) return;
          let dataNewsMap = dataNews.map((item) => {
            return [null, ...Object.values(item)];
          });
          await queryMySQL("DELETE FROM stock_price WHERE symbol = ?", [
            symbol,
          ]);
          await queryMySQL("INSERT INTO stock_price VALUES ?", [dataNewsMap]);
          console.log("Update stock price successfully");
          return data;
        } catch (error) {
          console.error("Có lỗi khi chuyển đổi dữ liệu:", error);
        }
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

async function getNewsDaily() {
  console.log("[getNewsDaily] Executed");
  let listSymbolData = [];

  let response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=1&pageSize=1000`
  );
  listSymbolData = response?.data?.data || listSymbolData;
  //wait 1s
  await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
  response = await axios.get(
    `http://localhost:3020/Securities?pageIndex=2&pageSize=1000`
  );
  listSymbolData = response.data.data
    ? [...listSymbolData, ...response.data.data]
    : listSymbolData;
  for (let i = 0; i < listSymbolData.length; i++) {
    const symbol = listSymbolData[i]?.Symbol;
    await getNews(symbol);
    await getThongKeGiaoDich(symbol);
    // await getFinancialAnalysis(symbol);
    //wait 5s
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  }
}

async function getLaiSuatDaily() {
  console.log("[getLaiSuatDaily] Executed");
  try {
    let response = await axios.get("https://chogia.vn/lai-suat/");

    // Your HTML string
    const html = response?.data; // Replace `...` with your actual HTML content

    // Load the HTML string into cheerio
    const $ = cheerio.load(html);

    // Initialize an empty array to hold the data
    const data = [];
    const dataOnline = [];

    // Parse the table rows
    $("table#offline-tbl tbody tr").each((index, element) => {
      // Skip the last row which contains the update time
      if (!$(element).hasClass("cg_credit")) {
        const bankName = $(element).find("td.sticky_col a").text().trim();
        const values = $(element)
          .find("td.price")
          .map((i, el) => $(el).text().trim() || null)
          .get();

        // Push a new object into the data array
        data.push({
          bankName,
          value0Month: values[0],
          value1Month: values[1],
          value3Month: values[2],
          value6Month: values[3],
          value9Month: values[4],
          value12Month: values[5],
          value13Month: values[6],
          value18Month: values[7],
          value24Month: values[8],
          value36Month: values[9],
          // timeUpdate will be added after this loop
        });
      }
    });
    $("table#online-tbl tbody tr").each((index, element) => {
      // Skip the last row which contains the update time
      if (!$(element).hasClass("cg_credit")) {
        const bankName = $(element).find("td.sticky_col a").text().trim();
        const values = $(element)
          .find("td.price")
          .map((i, el) => $(el).text().trim() || null)
          .get();

        // Push a new object into the data array
        dataOnline.push({
          bankName,
          value0Month: values[0],
          value1Month: values[1],
          value3Month: values[2],
          value6Month: values[3],
          value9Month: values[4],
          value12Month: values[5],
          value13Month: values[6],
          value18Month: values[7],
          value24Month: values[8],
          value36Month: values[9],
          // timeUpdate will be added after this loop
        });
      }
    });

    // Parse the update time
    const timeUpdate = $("table#offline-tbl tbody tr.cg_credit td")
      .text()
      .replace("Chợ Giá cập nhật lúc ", "")
      .trim();

    // Add the timeUpdate to each object in the data array
    data.forEach((obj) => (obj.timeUpdate = timeUpdate));
    dataOnline.forEach((obj) => (obj.timeUpdate = timeUpdate));

    // Output the result
    let filterData = data.filter((item) => item.bankName !== "");
    let filterDataOnline = dataOnline.filter((item) => item.bankName !== "");

    let dataMap = filterData.map((item) => {
      return [...Object.values(item)];
    });
    let dataMapOnline = filterDataOnline.map((item) => {
      return [...Object.values(item)];
    });
    //delete old data
    await queryMySQL("DELETE FROM lai_suat");
    //insert new data
    await queryMySQL("INSERT INTO lai_suat VALUES ?", [dataMap]);

    //delete old data
    await queryMySQL("DELETE FROM lai_suat_online");
    //insert new data
    await queryMySQL("INSERT INTO lai_suat_online VALUES ?", [dataMapOnline]);
  } catch (error) {
    console.log("error: ", error);
  }
}

module.exports = {
  getNewsDaily,
  getLaiSuatDaily,
};

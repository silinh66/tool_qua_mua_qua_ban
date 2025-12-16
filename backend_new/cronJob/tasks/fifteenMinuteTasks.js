// tasks/fifteenMinuteTasks.js
const axios = require("axios");
const queryMySQL = require("../../utils/queryMySQL");
const cheerio = require("cheerio");

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

async function getGiaXangDau() {
  console.log("[getGiaXangDau] Executed");
  try {
    let response = await axios.get(
      "https://chogia.vn/gia-xang-dau-vung-1-vung-2-gom-nhung-tinh-nao-15010"
    );

    const html = response?.data;

    const $ = cheerio.load(html);
    const petrolPrices = [];
    $("table.tbl_style_embed tbody tr").each((index, element) => {
      const petroName = $(element).find("td").eq(0).text().trim();
      const area1 = $(element).find("td").eq(1).text().trim();
      const area2 = $(element).find("td").eq(2).text().trim();

      const data = {
        petroName,
        area1,
        area2,
      };
      petrolPrices.push(data);
    });
    let dataMap = petrolPrices.map((item) => {
      return [...Object.values(item)];
    });
    if (dataMap?.length === 0) {
      console.log("No data found for petrol prices.");
      return;
    }
    //delete old data
    await queryMySQL("DELETE FROM gia_xang_dau");
    //insert new data
    await queryMySQL("INSERT INTO gia_xang_dau VALUES ?", [dataMap]);
  } catch (error) {
    console.log("error: ", error);
  }
}

async function getTyGiaNgoaiTe() {
  console.log("[getTyGiaNgoaiTe] Executed");
  try {
    let response = await axios.get("https://chogia.vn/ty-gia/vietcombank");

    const html = response?.data;

    const $ = cheerio.load(html);
    const exchangeRates = [];

    $("table#tbl_ty_gia tbody tr").each((index, element) => {
      const currencyCode = $(element).find("td").eq(0).text().trim();
      const currencyName = $(element).find("td").eq(1).text().trim();
      const buy = $(element).find("td").eq(2).text().trim();
      const sell = $(element).find("td").eq(3).text().trim();
      const transfer = $(element).find("td").eq(4).text().trim();

      exchangeRates.push({
        currencyCode,
        currencyName,
        buy,
        sell,
        transfer,
      });
    });

    let dataMap = exchangeRates.map((item) => {
      return [...Object.values(item)];
    });

    if (dataMap?.length === 0) {
      console.log("No data found for exchange rates.");
      return;
    }
    //delete old data
    await queryMySQL("DELETE FROM ty_gia_ngoai_te");
    //insert new data
    await queryMySQL("INSERT INTO ty_gia_ngoai_te VALUES ?", [dataMap]);
  } catch (error) {
    console.log("error: ", error);
  }
}

// Store last successful update time
let lastSuccessfulUpdate = null;

async function updateCorrectPriceStockOverview() {
  console.log("[updateCorrectPriceStockOverview] Executed");
  try {
    // Check if we should skip execution based on last successful update
    if (lastSuccessfulUpdate) {
      const now = new Date();
      const vietnamTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
      );
      const hours = vietnamTime.getHours();
      const minutes = vietnamTime.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;

      // If last update was successful and we haven't reached 14:45 yet, skip
      if (currentTimeInMinutes < 885) {
        // Before 14:45
        const timeSinceLastUpdate = now - lastSuccessfulUpdate;
        const hoursSinceUpdate = timeSinceLastUpdate / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          console.log(
            "Skipping update - data already synced. Will resume after 14:45"
          );
          return;
        }
      } else {
        // Reset flag after 14:45
        lastSuccessfulUpdate = null;
      }
    }

    const https = require("https");
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Get stock codes from stock_overview table where length = 3
    const stocks = await queryMySQL(
      "SELECT c, p, dc, dcp FROM stock_overview WHERE LENGTH(c) = 3"
    );

    if (!stocks || stocks.length === 0) {
      console.log("No stocks found with length = 3");
      return;
    }

    console.log(`Found ${stocks.length} stocks to check`);

    let allDataMatched = true;
    let updatedCount = 0;

    // Update each stock
    for (const stock of stocks) {
      const symbol = stock.c;
      try {
        let data = await axios.get(
          `https://api.finpath.vn/api/stocks/v2/trades/${symbol}?page=1&pageSize=3000`,
          { httpsAgent }
        );
        let dataResponse = data?.data?.data?.trades;

        if (dataResponse && dataResponse.length > 0) {
          const item = dataResponse[0];

          // Check if data is different from current database values
          if (
            stock.p !== item?.p ||
            stock.dc !== item?.ch ||
            stock.dcp !== item?.chp
          ) {
            // Update stock_overview table
            await queryMySQL(
              "UPDATE stock_overview SET p = ?, dc = ?, dcp = ? WHERE c = ?",
              [item?.p, item?.ch, item?.chp, symbol]
            );

            console.log(
              `Updated ${symbol}: p=${item?.p}, dc=${item?.ch}, dcp=${item?.chp}`
            );
            updatedCount++;
            allDataMatched = false;
          }
        }
      } catch (error) {
        console.log(`Error updating ${symbol}:`, error.message);
        allDataMatched = false;
      }
    }

    if (allDataMatched) {
      lastSuccessfulUpdate = new Date();
      console.log(
        "All stock data matched API - stopping updates until 14:45 tomorrow"
      );
    } else {
      console.log(`Finished updating - ${updatedCount} stocks updated`);
    }
  } catch (error) {
    console.log("error: ", error);
  }
}

// ------------------------- New functions for chogia.vn chart data -------------------------

/**
 * Parse "dd/mm" or "d/m" into "YYYY-MM-DD" using Asia/Ho_Chi_Minh timezone.
 * Logic for determining year:
 * - Use current Vietnam year
 * - If parsed month > current month, assume previous year (handles Dec -> Jan crossing)
 */
function parseDayMonthToDate(ddmm) {
  if (!ddmm || typeof ddmm !== "string") return null;
  const parts = ddmm.split("/").map((s) => s.trim());
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (Number.isNaN(day) || Number.isNaN(month)) return null;

  const now = new Date();
  const vnNowStr = now.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const vnNow = new Date(vnNowStr);
  const currentYear = vnNow.getFullYear();
  const currentMonth = vnNow.getMonth() + 1; // 1-12

  let year = currentYear;
  if (month > currentMonth) {
    year = currentYear - 1;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`; // YYYY-MM-DD
}

/**
 * Ensure the shared table exists for storing chart data for all companies.
 * Table: gold_chart_chogia
 * Unique key: (company, price_date)
 */
async function ensureGoldChartTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS gold_chart_chogia (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      company VARCHAR(100) NOT NULL,
      price_date DATE NOT NULL,
      sell BIGINT NULL,
      buy BIGINT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY ux_company_price_date (company, price_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await queryMySQL(createTableSQL);
}

/**
 * Fetch chart data for a single company and upsert into DB.
 * - companyParam: exact string used for "congty" form field (e.g., "SJC" or "Bảo Tín Minh Châu")
 * - companyLabel: normalized label stored in DB (recommend keep same as companyParam)
 */
async function getGiaVangChogiaForCompany(companyParam, companyLabel = null) {
  const company = companyLabel || companyParam;
  console.log(
    `[getGiaVangChogiaForCompany] Executing for company=${companyParam}`
  );
  try {
    // prepare form-data body (URL-encoded)
    const params = new URLSearchParams();
    params.append("action", "load_gia_vang_cho_do_thi");
    params.append("congty", companyParam);

    const resp = await axios.post(
      "https://chogia.vn/wp-admin/admin-ajax.php",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        timeout: 15000,
      }
    );

    const body = resp?.data;
    if (!body || !body.success || !Array.isArray(body.data)) {
      console.log(
        `[getGiaVangChogiaForCompany] No data for ${companyParam} or unexpected response`
      );
      return;
    }

    // ensure table exists
    await ensureGoldChartTable();

    // prepare values: [company, price_date, sell, buy]
    const rows = [];
    for (const item of body.data) {
      const ngay = item.ngay;
      const priceDate = parseDayMonthToDate(ngay);
      if (!priceDate) continue;

      const sellRaw = item.gia_ban
        ? String(item.gia_ban).replace(/[^\d\-\.]/g, "")
        : null;
      const buyRaw = item.gia_mua
        ? String(item.gia_mua).replace(/[^\d\-\.]/g, "")
        : null;
      const sell =
        sellRaw !== "" && sellRaw != null ? parseInt(sellRaw, 10) : null;
      const buy = buyRaw !== "" && buyRaw != null ? parseInt(buyRaw, 10) : null;

      rows.push([company, priceDate, sell, buy]);
    }

    if (rows.length === 0) {
      console.log(
        `[getGiaVangChogiaForCompany] No valid rows for ${companyParam}`
      );
      return;
    }

    /**
     * Upsert logic:
     * - Insert rows in batch
     * - On duplicate (company, price_date) update sell & buy only if changed.
     *   Also update updated_at only when values changed.
     *
     * MySQL: use conditional update with IF(VALUES(...) <> column, VALUES(...), column)
     */
    const insertSQL = `
      INSERT INTO gold_chart_chogia (company, price_date, sell, buy)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        sell = IF(VALUES(sell) <> sell, VALUES(sell), sell),
        buy = IF(VALUES(buy) <> buy, VALUES(buy), buy),
        updated_at = IF(VALUES(sell) <> sell OR VALUES(buy) <> buy, CURRENT_TIMESTAMP, updated_at)
    `;

    await queryMySQL(insertSQL, [rows]);
    console.log(
      `[getGiaVangChogiaForCompany] Upserted ${rows.length} rows for company=${company}`
    );
  } catch (error) {
    console.log(
      `[getGiaVangChogiaForCompany] Error for ${companyParam}:`,
      error?.message || error
    );
  }
}

/**
 * Fetch for all companies (to be run every 15 minutes).
 * Companies list as requested:
 * SJC, PNJ, DOJI, Bảo Tín Minh Châu, Phú Quý, Mi Hồng
 *
 * Note: use the exact strings expected by the API for 'congty' param.
 * If the API expects alternative spellings (e.g., "Bao Tin Minh Chau"), adjust the array accordingly.
 */
async function getGiaVangChogiaForCompanies() {
  console.log(
    "[getGiaVangChogiaForCompanies] Executed - fetching all companies"
  );
  const companies = [
    "SJC",
    "PNJ",
    "DOJI",
    "Bảo Tín Minh Châu",
    "Phú Quý",
    "Mi Hồng",
  ];

  // If the API expects ASCII-only company names for some items, you may need to adjust,
  // e.g., "Bao Tin Minh Chau" instead of "Bảo Tín Minh Châu".
  // If you know exact strings API accepts, replace elements above.

  for (const c of companies) {
    // call sequentially to avoid hammering remote server. If you want parallel, use Promise.all with rate-limits.
    // The code below calls sequentially and logs errors per company.
    await getGiaVangChogiaForCompany(c);
  }

  console.log("[getGiaVangChogiaForCompanies] Done");
}

// ------------------------- module exports -------------------------
module.exports = {
  getGiaVangNew,
  getGiaXangDau,
  getTyGiaNgoaiTe,
  updateCorrectPriceStockOverview,
  getGiaVangChogiaForCompany,
  getGiaVangChogiaForCompanies,
};

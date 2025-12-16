const axios = require("axios");
const puppeteer = require("puppeteer");
const queryMySQL = require("../utils/queryMySQL");

const CONFIG = {
  chromeExecutable:
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  userDataDir:
    "C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1",
  login: {
    email: "dautubenvungai@gmail.com",
    password: "hEn_ndY7Lk2ggrq",
  },
  baseUrl: "https://fiintrade.vn",
  ratioEndpoint:
    "fundamental.fiintrade.vn/FinancialAnalysis/GetFinancialRatioV2",
  curTimeline: "2025_1",
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function ensureLoggedIn(page) {
  await page.goto(CONFIG.baseUrl, { waitUntil: "networkidle0" });
  try {
    await page.waitForSelector(".login-button", { timeout: 3000 });
    console.log("Logging in...");
    await page.click(".login-button");
    await page.waitForSelector("#exampleInputEmail1");
    await page.type("#exampleInputEmail1", CONFIG.login.email, { delay: 50 });
    await page.type("#exampleInputPassword1", CONFIG.login.password, {
      delay: 50,
    });
    await page.click("#home > form > fieldset > div:nth-child(3) > button");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("Login successful.");
  } catch {
    console.log("Already logged in, skipping login.");
  }
}

async function scrapeFinancialRatio(page, symbol) {
  console.log(
    `\n=== Scraping ratios for ${symbol} (Timeline=${CONFIG.curTimeline}) ===`
  );
  await page.goto(CONFIG.baseUrl, { waitUntil: "networkidle0" });

  //   await delay(60 * 1000);

  await page.waitForSelector(".company-name");
  await page.evaluate(() => document.querySelector(".company-name").click());
  await page.evaluate(() => document.querySelector(".company-name").click());
  await page.type(".ticker", symbol, { delay: 50 });
  await page.keyboard.press("Enter");

  let response;
  try {
    response = await page.waitForResponse(
      (res) => {
        const u = res.url();
        return (
          u.includes(CONFIG.ratioEndpoint) &&
          u.includes(CONFIG.curTimeline) &&
          res.request().method() === "GET"
        );
      },
      { timeout: 5000 }
    );
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn(`  ❌ Timeout fetching ratios for ${symbol}`);
      return;
    }
    throw error;
  }

  const data = await response.json();
  if (!data?.items?.length) {
    console.warn(`  ❌ No ratio data for ${symbol}`);
    return;
  }

  const dataNews = data.items;
  const dataFilter = dataNews.filter(
    (item) => item?.key === CONFIG.curTimeline
  );
  const dataNewsMap = dataFilter.map((item) => item?.value);
  const dataNewsFilter = dataNewsMap.filter(
    (item) => item?.organCode === symbol
  );
  if (!dataNewsFilter.length) {
    console.warn(`  ❌ No matching timeline for ${symbol}`);
    return;
  }
  const dataFinancialMap = dataNewsFilter.map((item) => [
    item?.organCode,
    item?.icbCode,
    item?.comTypeCode,
    item?.yearReport,
    item?.lengthReport,
    item?.yearReportCal,
    item?.lengthReportCal,
    item?.rev,
    item?.ryq34,
    item?.isa22,
    item?.ryq39,
    item?.ryq27,
    item?.ryq29,
    item?.ryq25,
    item?.ryq12,
    item?.ryq76,
    item?.ryq14,
    item?.ryq3,
    item?.ryq1,
    item?.ryq2,
    item?.ryq77,
    item?.ryq71,
    item?.ryq31,
    item?.ryq91,
    item?.ryq16,
    item?.ryq18,
    item?.ryq20,
    item?.cashCycle,
    item?.ryq10,
    item?.ryq6,
    item?.ryd11,
    item?.ryd3,
    item?.ryd21,
    item?.ryd25,
    item?.ryd26,
    item?.ryd28,
    item?.ryd14,
    item?.ryd7,
    item?.ryd30,
    item?.bsa1,
    item?.bsa2,
    item?.bsa5,
    item?.bsa8,
    item?.bsa10,
    item?.bsa159,
    item?.bsa15,
    item?.bsa18,
    item?.bsa23,
    item?.bsa24,
    item?.bsa162,
    item?.bsa27,
    item?.bsa29,
    item?.bsa43,
    item?.bsa49,
    item?.bsa50,
    item?.bsa209,
    item?.bsa53,
    item?.bsa54,
    item?.bsa55,
    item?.bsa56,
    item?.bsa58,
    item?.bsa67,
    item?.bsa71,
    item?.bsa173,
    item?.bsa78,
    item?.bsa79,
    item?.bsa80,
    item?.bsa175,
    item?.bsa86,
    item?.bsa90,
    item?.bsa96,
    item?.cfa21,
    item?.cfa22,
  ]);

  await queryMySQL(
    `INSERT INTO financial_ratio (
                organCode,
                icbCode,
                comTypeCode,
                yearReport,
                lengthReport,
                yearReportCal,
                lengthReportCal,
                rev,
                ryq34,
                isa22,
                ryq39,
                ryq27,
                ryq29,
                ryq25,
                ryq12,
                ryq76,
                ryq14,
                ryq3,
                ryq1,
                ryq2,
                ryq77,
                ryq71,
                ryq31,
                ryq91,
                ryq16,
                ryq18,
                ryq20,
                cashCycle,
                ryq10,
                ryq6,
                ryd11,
                ryd3,
                ryd21,
                ryd25,
                ryd26,
                ryd28,
                ryd14,
                ryd7,
                ryd30,
                bsa1,
                bsa2,
                bsa5,
                bsa8,
                bsa10,
                bsa159,
                bsa15,
                bsa18,
                bsa23,
                bsa24,
                bsa162,
                bsa27,
                bsa29,
                bsa43,
                bsa49,
                bsa50,
                bsa209,
                bsa53,
                bsa54,
                bsa55,
                bsa56,
                bsa58,
                bsa67,
                bsa71,
                bsa173,
                bsa78,
                bsa79,
                bsa80,
                bsa175,
                bsa86,
                bsa90,
                bsa96,
                cfa21,
                cfa22
            ) VALUES ?`,
    [dataFinancialMap]
  );
  console.log(`  ✅ Done ratios for ${symbol}`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CONFIG.chromeExecutable,
    userDataDir: CONFIG.userDataDir,
  });
  const page = await browser.newPage();
  await ensureLoggedIn(page);

  const symbols = [];
  for (const i of [1, 2]) {
    const resp = await axios.get(
      `http://127.0.0.1:3000/market/Securities?pageIndex=${i}&pageSize=1000`
    );
    symbols.push(...(resp.data.data || []));
    await delay(3000);
  }
  console.log(`Total symbols fetched: ${symbols.length}`);

  const startFrom = "CVT";
  const idx = symbols.findIndex((s) => s.Symbol === startFrom);
  const toProcess = idx >= 0 ? symbols.slice(idx + 1) : symbols;

  for (const { Symbol } of toProcess) {
    if (Symbol.length > 3) {
      console.log(`Skipping ${Symbol} (length > 3)`);
      continue;
    }
    await scrapeFinancialRatio(page, Symbol);
    await delay(1000);
  }

  await browser.close();
  console.log("All done.");
})();

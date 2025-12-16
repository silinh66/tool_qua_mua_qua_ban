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
  incomeSheetEndpoint:
    "fundamental.fiintrade.vn/FinancialStatement/GetIncomeStatement",
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

async function scrapeIncomeStatement(page, symbol, year, quarter) {
  console.log(
    `\n=== Scraping ${symbol} for Q${quarter}/${year} (Income Statement) ===`
  );
  await page.goto(CONFIG.baseUrl, { waitUntil: "networkidle0" });

  await page.waitForSelector(".company-name");
  await page.click(".company-name");
  await page.type(".ticker", symbol, { delay: 50 });
  await page.keyboard.press("Enter");

  let response;
  try {
    response = await page.waitForResponse(
      (res) => {
        const url = res.url();
        return (
          url.includes(
            "fundamental.fiintrade.vn/FinancialStatement/GetIncomeStatement"
          ) && res.request().method() === "GET"
        );
      },
      { timeout: 5000 } // 30s
    );
  } catch (error) {
    if (error.name === "TimeoutError") {
      console.warn(`  ❌ Timeout waiting for income statement for ${symbol}`);
      return;
    }
    throw error;
  }

  const { items } = await response.json();
  if (!items?.length) {
    console.warn(`  ❌ No data items for ${symbol} Q${quarter}/${year}`);
    return;
  }

  const data = items[0].quarterly || items[0].yearly;
  const matched = data.filter(
    (it) => it.yearReport === year && it.quarterReport === quarter
  );
  if (!matched.length) {
    console.warn(`  ❌ No matching entries for ${symbol}`);
    return;
  }

  const rows = matched.map((item) => [symbol, ...Object.values(item).slice(1)]);
  console.log(
    `  ✅ Parsed ${rows.length} rows, inserting into ket_qua_kinh_doanh...`
  );
  await queryMySQL("INSERT INTO ket_qua_kinh_doanh VALUES ?", [rows]);
  console.log(`  ✅ Done ${symbol} Q${quarter}/${year}`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CONFIG.chromeExecutable,
    userDataDir: CONFIG.userDataDir,
  });
  const page = await browser.newPage();
  await ensureLoggedIn(page);

  // fetch symbols
  const symbols = [];
  for (const i of [1, 2]) {
    const resp = await axios.get(
      `http://127.0.0.1:3000/market/Securities?pageIndex=${i}&pageSize=1000`
    );
    symbols.push(...(resp.data.data || []));
    await delay(3000);
  }
  console.log(`Total symbols fetched: ${symbols.length}`);

  // resume from A32
  const startFrom = "ABC";
  const idx = symbols.findIndex((s) => s.Symbol === startFrom);
  const toProcess = idx >= 0 ? symbols.slice(idx) : symbols;

  // chạy Q1 2025
  for (const { Symbol } of toProcess) {
    if (Symbol.length > 3) {
      console.log(`Skipping ${Symbol} (length > 3)`);
      continue;
    }
    await scrapeIncomeStatement(page, Symbol, 2025, 1);
    await delay(1000);
  }

  await browser.close();
  console.log("All done.");
})();

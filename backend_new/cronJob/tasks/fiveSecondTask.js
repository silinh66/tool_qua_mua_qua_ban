// tasks/fetchThanhKhoan.js
const axios = require("axios");
const moment = require("moment");
const queryMySQL = require("../../utils/queryMySQL");
const fs = require("fs");

async function fetchStockOverview() {
  try {
    const response = await axios.get(
      "https://api.finpath.vn/api/stocks/v2/overview"
    );
    const stocks = response.data?.data?.stocks;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      console.warn("⚠️ Không có dữ liệu mới. Bỏ qua cập nhật.");
      return;
    }

    const formatted = stocks.map((stock) => {
      const validDate = stock.d && stock.d !== "" ? stock.d : null;
      return [
        stock.ms,
        stock.c,
        validDate,
        stock.ste,
        stock.sn,
        stock.sne,
        stock.dv,
        stock.dve,
        stock.wv,
        stock.wve,
        stock.mv,
        stock.mve,
        stock.e,
        stock.dc,
        stock.dcp,
        stock.wc,
        stock.wcp,
        stock.mc,
        stock.mcp,
        stock.ad5v,
        stock.pdv,
        stock.ad5vl,
        stock.ad10vl,
        stock.ad20vl,
        stock.am3vl,
        stock.dvp,
        stock.wvp,
        stock.mvp,
        stock.d7cp,
        stock.m1cp,
        stock.m3cp,
        stock.y1cp,
        stock.y3cp,
        stock.y5cp,
        stock.atcp,
        stock.dnrv,
        stock.hwp,
        stock.lwp,
        stock.hw52p,
        stock.lw52p,
        stock.hmp,
        stock.lmp,
        stock.hap,
        stock.lap,
        stock.p,
        stock.v,
        stock.op,
        stock.hp,
        stock.lp,
        stock.ce,
        stock.f,
        stock.rp,
        stock.ap,
        stock.mkc,
        stock.ls,
        stock.td,
        stock.pe,
        stock.pb,
        stock.eps,
        stock.roa,
        stock.roe,
        stock.ps,
        stock.t,
      ];
    });

    const columns = `
        ms, c, d, ste, sn, sne, dv, dve, wv, wve, mv, mve, e, dc, dcp, wc, wcp,
        mc, mcp, ad5v, pdv, ad5vl, ad10vl, ad20vl, am3vl, dvp, wvp, mvp, d7cp,
        m1cp, m3cp, y1cp, y3cp, y5cp, atcp, dnrv, hwp, lwp, hw52p, lw52p, hmp,
        lmp, hap, lap, p, v, op, hp, lp, ce, f, rp, ap, mkc, ls, td, pe, pb,
        eps, roa, roe, ps, t
      `
      .replace(/\s+/g, "")
      .split(",");

    const updateClause = columns
      .filter((col) => col !== "c") // exclude primary key
      .map((col) => `${col} = VALUES(${col})`)
      .join(", ");

    const sql = `
        INSERT INTO stock_overview (${columns.join(", ")})
        VALUES ?
        ON DUPLICATE KEY UPDATE ${updateClause}
      `;

    await queryMySQL(sql, [formatted]);

    console.log(
      `✅ fetchStockOverview: Đã chèn/cập nhật ${formatted.length} dòng`
    );
  } catch (error) {
    console.error("❌ Lỗi khi fetch stock overview:", error.message);
  }
}

const getIboard = async () => {
  let response = await axios.get(`https://api.finpath.vn/api/stocks/iboard`);
  //write to iboard.json file
  fs.writeFileSync("iboard.json", JSON.stringify(response?.data?.data?.stocks));
};

const getIndexesOverview = async () => {
  let response = await axios.get(
    `https://api.finpath.vn/api/indexes/v2/overview`
  );
  //write to indexes_overview.json file
  fs.writeFileSync(
    "indexes_overview.json",
    JSON.stringify(response?.data?.data?.indexs)
  );
  // console.log("response: ", response?.data?.data?.stocks);
};

module.exports = {
  fetchStockOverview,
  getIboard,
  getIndexesOverview,
};

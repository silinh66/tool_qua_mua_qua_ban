function buildApiUrl(indexCode, date, historical) {
  const baseUrl = "https://api-finfo.vndirect.com.vn/v4/";
  const endpoint = historical
    ? "index_intraday_histories"
    : "index_intraday_latest";
  const fields = "tradingDate_Time,accumulatedVal";
  const size = "100000";
  return `${baseUrl}${endpoint}?sort=time:asc&q=code:${indexCode}~tradingDate:${date}&fields=${fields}&size=${size}`;
}

module.exports = {
  buildApiUrl,
};

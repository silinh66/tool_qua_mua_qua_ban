// controllers/_marketAuthHelper.js
const axios = require("axios");

const MARKET_API_URL =
  process.env.MARKET_API_URL || "https://fc-data.ssi.com.vn/api/v2/Market/";
const ACCESS_TOKEN_URL = MARKET_API_URL + "AccessToken";
const MARKET_CONSUMER_ID = process.env.MARKET_CONSUMER_ID;
const MARKET_CONSUMER_SECRET = process.env.MARKET_CONSUMER_SECRET;

let cachedToken = null;
let cachedTokenExpire = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpire) {
    return cachedToken;
  }
  try {
    const { data: resp } = await axios.post(ACCESS_TOKEN_URL, {
      consumerID: MARKET_CONSUMER_ID,
      consumerSecret: MARKET_CONSUMER_SECRET,
    });
    if (resp.status === 200 && resp.data && resp.data.accessToken) {
      cachedToken = "Bearer " + resp.data.accessToken;
      // Giả sử token hợp lệ 15 phút, set expire = giờ hiện tại + 14 phút
      cachedTokenExpire = now + 14 * 60 * 1000;
      return cachedToken;
    } else {
      throw new Error(
        "Invalid response from AccessToken: " + JSON.stringify(resp)
      );
    }
  } catch (err) {
    console.error(
      "Error fetching access token:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = { getAccessToken };

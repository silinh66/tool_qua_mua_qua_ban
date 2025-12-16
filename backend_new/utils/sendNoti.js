const admin = require("../middlewares/firebase");
const { getMessaging } = require("firebase-admin/messaging");
const moment = require("moment");
const sendNotification = async (registrationToken, title, body, data = {}) => {
  const message = {
    token: registrationToken,
    notification: {
      title: title,
      body: body,
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: title,
            body: body,
          },
          sound: "default",
        },
      },
    },
    data: data, // Optional: dùng cho các thông tin tùy chỉnh
    // Bạn có thể cấu hình thêm các options như 'android' hay 'apns' nếu cần
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  console.log("tokens: ", tokens);
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn("No tokens provided to sendMulticastNotification.");
    return { invalidTokens: [] };
  }

  const message = {
    tokens,
    notification: { title, body },
    apns: {
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
        },
      },
    },
    data,
  };

  try {
    // **CHÍNH Ở ĐÂY**: dùng getMessaging(admin.app()) để chắc chắn gọi v1 API
    const messaging = getMessaging(admin.app());
    const response = await messaging.sendEachForMulticast(message);

    console.log(
      "Multicast result - successCount:",
      response.successCount,
      " failureCount:",
      response.failureCount
    );

    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error.code === "messaging/registration-token-not-registered"
      ) {
        invalidTokens.push(tokens[idx]);
      }
    });

    return { invalidTokens };
  } catch (error) {
    console.error("Multicast send error:", error);
    throw error;
  }
};

const registrationToken =
  "cAIibATtgkxxlKJfUdoCrN:APA91bFN7i7DEAIsLoXw9WV-ylIhqoOyaxYdulBXd1aCYVDR5qrPmJim8skdHjaNwNWwbiKCxrodI8_jNWczIulA6aFeM_V2pBH-zohkn-4agliJSoNSFbo";
// sendNotification(
//   registrationToken,
//   `Thông báo kết phiên giao dịch ngày ${moment().format("DD/MM/YYYY")}`,
//   `Giá vàng hôm nay: 122.000
// Giá chứng khoán hôm nay 1,197.13 -9.94 (-0.82%)`
// );

module.exports = sendMulticastNotification;

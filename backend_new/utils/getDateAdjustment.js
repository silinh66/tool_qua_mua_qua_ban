const moment = require("moment");

function getDateAdjustment(historical) {
  const today = moment();
  if (!historical) {
    return today.format("YYYY-MM-DD");
  }

  switch (today.day()) {
    case 1: // Monday
      return today.subtract(3, "days").format("YYYY-MM-DD");
    case 0: // Sunday
      return today.subtract(3, "days").format("YYYY-MM-DD");
    case 6: // Saturday
      return today.subtract(2, "days").format("YYYY-MM-DD");
    default: // Tuesday, Wednesday, Thursday
      return today.subtract(1, "days").format("YYYY-MM-DD");
  }
}

module.exports = {
  getDateAdjustment,
};

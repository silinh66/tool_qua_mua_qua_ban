function convertMonthNumberToString(month) {
  return month < 10 ? `0${month}` : `${month}`;
}

function getPrevMonthInfo(month, year) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return { prevMonth, prevYear };
}

function getListMonthMap(year) {
  return [
    `31/01/${year}`,
    `28/02/${year}`,
    `31/03/${year}`,
    `30/04/${year}`,
    `31/05/${year}`,
    `30/06/${year}`,
    `31/07/${year}`,
    `31/08/${year}`,
    `30/09/${year}`,
    `31/10/${year}`,
    `30/11/${year}`,
    `31/12/${year}`,
  ];
}

module.exports = {
  convertMonthNumberToString,
  getPrevMonthInfo,
  getListMonthMap,
};

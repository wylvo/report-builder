import { state, initThemeInLocalStorage } from "../model.js";
import api from "../api.js";

import * as accountModel from "../account/accountModel.js";
import * as userModel from "../users/userModel.js";

// 1st function to be ran by ./dashboardController.js
const init = async () => {
  await Promise.all([
    DB.getStats(),
    accountModel.DB.getCurrentUserAccount(),
    userModel.DB.getUsersFrontend(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

const DB = {
  getStats: async () => {
    const { data } = await api.v1.stats.getStats();

    state.stats = data.data;

    state.stats.reportsByYear.reverse();

    return data;
  },
};

// Sort weekdays
const sortWeekdays = (weekdays, key = "weekday") => {
  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Create a map for the order of the weekdays
  const orderMap = weekdayOrder.reduce((map, day, index) => {
    map[day] = index;
    return map;
  }, {});

  // Sort the weekdays array based on the orderMap
  return weekdays.sort((a, b) => orderMap[a[key]] - orderMap[b[key]]);
};

// Calculate weekday average
const calculateWeekdayAverages = () => {
  const reportsByWeekdays = state.stats.reportsByWeekdays;

  const weekdayAverages = [];
  const lookup = Object.groupBy(
    reportsByWeekdays,
    (reports) => reports.weekday
  );

  Object.values(lookup).forEach((data) => {
    let totalReports = 0;

    // Calculate sum of reports
    data.forEach((array) => (totalReports += array.reports));

    // Divide by the number of months and push to weekdayAverages array
    weekdayAverages.push({
      weekday: data[0].weekday,
      average: totalReports / data.length,
    });
  });

  weekdayAverages.map((data) => {
    if (data.weekday == "lundi") data.weekday = "Monday";
    if (data.weekday == "mardi") data.weekday = "Tuesday";
    if (data.weekday == "mercredi") data.weekday = "Wednesday";
    if (data.weekday == "jeudi") data.weekday = "Thursday";
    if (data.weekday == "vendredi") data.weekday = "Friday";
    if (data.weekday == "samedi") data.weekday = "Saturday";
    if (data.weekday == "dimanche") data.weekday = "Sunday";
  });

  sortWeekdays(weekdayAverages);

  return weekdayAverages;
};

// Calculate month average
const calculateMonthAverages = () => {
  const reportsByMonth = state.stats.reportsByMonth;
  reportsByMonth.map((data) => (data.month -= 1)); // month numbers begin at 0

  const monthAverages = [];
  const lookup = Object.groupBy(reportsByMonth, (reports) => reports.month);

  Object.values(lookup).forEach((data) => {
    let totalReports = 0;

    // Calculate sum of reports
    data.forEach((array) => (totalReports += array.reports));

    // Divide by the number of months and push to monthAverages array
    monthAverages.push({
      month: data[0].month,
      average: totalReports / data.length,
    });
  });

  return monthAverages;
};

export {
  // from -> ../model.js
  state,

  // from this local file -> ./dashboardModel.js
  DB,
  init,
  calculateWeekdayAverages,
  calculateMonthAverages,
};

import * as model from "./dashboardModel.js";

import notificationsView from "../_views/notificationsView.js";
import dashboardView from "./views/dashboardView.js";
import dashboardActivityTableView from "./views/dashboardActivityTableView.js";
import dashboardReportTableView from "./views/dashboardReportTableView.js";

// prettier-ignore
const controlPieChartSelect = function (
  targetValue = undefined,
  canvasElement = undefined
) {
  if (!targetValue || !canvasElement) return;
  const stats = model.state.stats;

  if (targetValue === "incidentType") {
    const labels = stats.reportsByIncidentTypes.map((iT) => iT.type);
    const datasetData = stats.reportsByIncidentTypes.map((iT) => iT.reports);
    dashboardView.pieChart(canvasElement, labels, datasetData);
  }

  if (targetValue === "incidentTransactionType") {
    const labels = stats.reportsByIncidentTransactionTypes.map((iT) => iT.type);
    const datasetsData = stats.reportsByIncidentTransactionTypes.map((iT) => iT.reports);
    dashboardView.pieChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "onCall") {
    const labels = [`On-call [${stats.reportsOnCall}]`, "NOT On-call"];
    const datasetsData = [stats.reportsOnCall, stats.reportsCount - stats.reportsOnCall];
    dashboardView.pieChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "procedural") {
    const labels = [`Procedural [${stats.reportsProcedural}]`, "NOT Procedural"];
    const datasetsData = [stats.reportsProcedural, stats.reportsCount - stats.reportsProcedural];
    dashboardView.pieChart(canvasElement, labels, datasetsData);
  }
};

// prettier-ignore
const controlLineChartSelect = function (
  targetValue = undefined,
  canvasElement = undefined
) {
  if (!targetValue || !canvasElement) return;
  const stats = model.state.stats;

  if (targetValue === "byWeekdayAverage") {
    const weekdayAverages = model.calculateWeekdayAverages();
    const labels = weekdayAverages.map((data) => data.weekday);
    const datasetsData = weekdayAverages.map((data) => data.average);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "byMonthlyAverage") {
    const monthAverages = model.calculateMonthAverages();
    const labels = monthAverages.map((data) => dashboardView.formatMonth(data.month));
    const datasetsData = monthAverages.map((data) => data.average);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "byYear") {
    const statsByYear = stats.reportsByYear.toReversed()
    const labels = statsByYear.map((data) => `${data.year}`);
    const datasetsData = statsByYear.map((data) => data.reports);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }
};

const controlWeekSelect = (weekIndex) => {
  weekIndex = Number(weekIndex);

  if (isNaN(weekIndex)) return;
  return model.state.stats.reportsByWeek[weekIndex];
};

const controlMonthSelect = (monthIndex) => {
  monthIndex = Number(monthIndex);

  if (isNaN(monthIndex)) return;
  return model.state.stats.reportsByMonth[monthIndex];
};

const controlYearSelect = (yearIndex) => {
  yearIndex = Number(yearIndex);

  if (isNaN(yearIndex)) return;
  return model.state.stats.reportsByYear[yearIndex];
};

const init = async function () {
  try {
    await model.init();

    dashboardActivityTableView.users = model.state.usersFrontend;
    dashboardReportTableView.users = model.state.usersFrontend;

    if (!window?.Chart)
      notificationsView.warning(
        "Could not find Chart.js module. Please contact your administrator."
      );

    dashboardView.renderAll(model.state.stats);

    controlPieChartSelect(
      dashboardView.pieChartSelectElement.firstElementChild.value,
      dashboardView.pieChartCanvas()
    );

    controlLineChartSelect(
      dashboardView.lineChartSelectElement.firstElementChild.value,
      dashboardView.lineChartCanvas()
    );

    dashboardActivityTableView.renderAll(model.state.stats.recentActivityLog);
    dashboardReportTableView.renderAll(
      model.state.stats.reportsRecentlyCreated.slice(0, 7)
    );

    dashboardView.addHandlerPieChartSelectOnChange(controlPieChartSelect);
    dashboardView.addHandlerLineChartSelectOnChange(controlLineChartSelect);
    dashboardView.addHandlerWeekSelectOnChange(controlWeekSelect);
    dashboardView.addHandlerMonthSelectOnChange(controlMonthSelect);
    dashboardView.addHandlerYearSelectOnChange(controlYearSelect);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

init();

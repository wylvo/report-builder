import * as model from "./dashboardModel.js";

import notificationsView from "../_views/notificationsView.js";
import dashboardView from "./views/dashboardView.js";

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
    const sortedWeekdays = dashboardView.sortWeekdays(stats.reportsByWeekdays, "weekday");
    const labels = sortedWeekdays.map((data) => data.weekday);
    const datasetsData = sortedWeekdays.map((data) => data.average);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "byMonthAverage") {
    const labels = stats.reportsByMonth.map((data) => dashboardView.formatMonth(data.month));
    const datasetsData = stats.reportsByMonth.map((data) => data.average);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }

  if (targetValue === "byYear") {
    const labels = stats.reportsByYear.map((data) => `${data.year}`);
    const datasetsData = stats.reportsByYear.map((data) => data.reports);
    dashboardView.lineChart(canvasElement, labels, datasetsData);
  }
};

const init = async function () {
  try {
    await model.init();

    if (!window?.Chart)
      notificationsView.warning(
        "Could not find Chart.js module. Please contact your administrator."
      );

    dashboardView.renderAll(model.state.stats);

    controlPieChartSelect(
      dashboardView.pieChartSelectEl.firstElementChild.value,
      dashboardView.pieChartCanvas()
    );

    controlLineChartSelect(
      dashboardView.lineChartSelectEl.firstElementChild.value,
      dashboardView.lineChartCanvas()
    );

    dashboardView.addHandlerPieChartSelectOnChange(controlPieChartSelect);
    dashboardView.addHandlerLineChartSelectOnChange(controlLineChartSelect);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

init();

import * as model from "../model/model.js";
import api from "../model/api.js";
import sidebarView from "../views/sidebar/sidebarView.js";
import themeView from "../views/themeView.js";
import searchView from "../views/searchView.js";
import paginationView from "../views/paginationView.js";
import reportTableView from "../views/reports/reportTableView.js";
import notificationView from "../views/notifications/notificationView.js";
import modalView from "../views/notifications/modalView.js";
import reportTabsView from "../views/reports/reportTabsView.js";

let reportFormView,
  takeSnapshot = false;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  reportFormView = reportTabsView.tabs.get(model.state.tab);
  const reportId = id ? id : model.state.tabs.get(tabIndex).report.id;
  reportTabsView.updateLocationHash(reportId);
};

// prettier-ignore
const controlUniqueReportPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.report.id && tab.report.id === id) {
      const reportFormView = reportTabsView.tabs.get(index);
      if (!event) reportFormView._tab.firstElementChild.click();
      return true;
    }
  }
  if (event) {
    controlTabs(model.state.tab, id);
    controlRenderReport();
  }
  return false;
};

// prettier-ignore
const controlPaste = function () {
  model.state.clipboard.forEach((clipboardInput, index) => {
    const reportInput = reportFormView._inputs.get("*").get(index);

    if (reportInput.getAttribute("type") === "checkbox") {
      if (reportInput.checked && !clipboardInput.checked) reportInput.click();
      if (!reportInput.checked && clipboardInput.checked) reportInput.click();
    }

    if (reportInput.getAttribute("type") !== "checkbox")
      reportInput.value = clipboardInput.value;
  });
  notificationView.success(`Report state pasted into tab ${model.state.tab + 1}`, 5);
  reportFormView._form.onchange();
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    reportTabsView.tabs.forEach((reportFormView) => reportFormView._btnPaste.disabled = false);
  notificationView.info(`Report state copied from tab ${model.state.tab + 1}`, 5);
};

const controlNewReport = function () {
  model.newReport(model.state.tab);
  reportFormView.newReport((takeSnapshot = true));
  reportTabsView.removeLocationHash();
};

const controlRenderReport = function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return controlNewReport();

    const isReportPresentInTab = controlUniqueReportPerTab(id);
    if (isReportPresentInTab) return;

    const report = model.loadReport(model.state.tab, id);
    reportFormView.render(report);
    console.log(model.state);
  } catch (error) {
    controlNewReport();
    notificationView.error(error.message, 60);
    console.error(error);
  }
};

// prettier-ignore
const controlSaveReport = async function (reportId) {
  const id = reportId ? reportId : window.location.hash.slice(1);
  let report;
  try {
    // Save report
    if (!id) {
      report = await model.DB.createReport(model.state.tab, reportFormView._form);
      reportTableView.render(report);
      reportTableView.updateTotalCount(model.state.reports);
      notificationView.success(`Report successfully created: [${report.id}]`);
    }

    // Save changes
    if (id) {
      report = await model.DB.updateReport(id, reportFormView._form);
      reportTableView.update(report);
      notificationView.success(`Report changes were saved: [${report.id}]`);
    }

    reportFormView.takeSnapshot(reportFormView.newClone());
    reportFormView.updateTags(report);
    reportFormView._btnTeams.disabled = false;
    reportTabsView.render(model.state.tab, report.incident.title, report.id);
    model.loadReport(model.state.tab, report.id);
    // api.sendBackupReports(model.state.reports);
  } catch (error) {
    notificationView.error(error.message, 60);
    console.error(error);
  }
};

// prettier-ignore
const controlSendReport = async function (id = undefined) {
  const hasIdInHash = window.location.hash.slice(1);
  let isPromptConfirmed = true;
  if (!id && hasIdInHash) id = hasIdInHash;

  const report = model.findReportById(id);
  const tabIndex = model.findReportInTab(report.id);
  const reportViewInTab = reportTabsView.tabs.get(tabIndex);
  const tableViewBtnTeams = report.tableRowEl.querySelector(".table-row-teams-btn");
  
  try {
    if (report.hasTriggeredWebhook)
      isPromptConfirmed = await modalView.confirmSend();
    if (!isPromptConfirmed) return;

    if(reportViewInTab) reportViewInTab.renderSpinner(reportViewInTab._btnTeams);
    reportTableView.renderSpinner(tableViewBtnTeams);

    const request = await api.sendTeamsWebhook(report);
    if(reportViewInTab) {
      reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "success");
      reportViewInTab._btnTeams.disabled = true;
    }

    reportTableView.clearSpinner(tableViewBtnTeams, "success");
    tableViewBtnTeams.disabled = true;
    notificationView.success(`Report successfully sent on Teams. Status code ${request.response.status} (${request.response.statusText})`);

    model.updateIsWebhookSent(report);
    model.updateHasTriggeredWebhook(report);

    console.log("Local:", JSON.parse(localStorage.getItem("reportsList")));
    console.log("Model:", model.state);
    console.log("Tab index:", tabIndex, model.state.tabs.get(tabIndex).report);
  } catch (error) {
    console.error(error);
    notificationView.error(error, 60);
    if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams);
    reportTableView.clearSpinner(tableViewBtnTeams);

    if (error.message.includes("Request failed")) {
      if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "error");
      reportTableView.clearSpinner(tableViewBtnTeams, "error");
      notificationView.warning("Make sure you have internet access.", 60);
    }
  }
};

// prettier-ignore
const controlDeleteReport = async function (id) {
  try {    
    const report = model.findReportById(id);
  
    let isDeleteConfirmed = true;
    isDeleteConfirmed = await modalView.confirmDelete(report);
    if(!isDeleteConfirmed) return;
    if(id === window.location.hash.slice(1)) reportTabsView.removeLocationHash();
  
    const tabIndex = model.findReportInTab(id);
    if (tabIndex) {
      model.newReport(tabIndex)
      reportTabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }
  
    await model.DB.deleteReport(id);
    reportTableView.updateTotalCount(model.state.reports);
    notificationView.success(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

  } catch (error) {
    notificationView.error(error, 60);
  }
};

// prettier-ignore
const controlUnsavedReport = async (controlFunction, handler = undefined, event = undefined) => {
  let isSaveConfirmed = false;
  const currentReportView = reportTabsView.tabs.get(model.state.tab);

  if (currentReportView._changes.length > 0) {
    if (event) event.preventDefault();
    isSaveConfirmed = await modalView.confirmSave();
  }
  if (isSaveConfirmed) {
    const id = window.location.hash.slice(1);
    if (currentReportView._changes.length > 0) return controlSaveReport(id);
  }

  if (typeof handler === "function") {
    const returnedValue = handler();
    if (returnedValue !== null || typeof returnedValue !== "undefined")
      return controlFunction(returnedValue, event);
  }
  return controlFunction(handler, event);
};

const controlSearchResults = function () {
  model.state.search.page = 1;

  const query = searchView.query();
  if (!query) {
    model.state.search.query = "";
    model.state.search.results = [];
    reportTableView.updateTotalCount(model.state.reports);
    return reportTableView.renderAll(model.rowsPerPage());
  }

  const filterBy = searchView.filterBy();
  model.filterSearch(query, filterBy);

  controlRenderAllReports();
  reportTableView.updateTotalCount(model.state.search.results);
};

const controlClearSearchResults = function () {
  controlRenderAllReports();
};

const controlRowsPerPage = function (rowsPerPage) {
  model.state.rowsPerPage = rowsPerPage;
  model.state.search.page = 1;

  controlRenderAllReports();
};

const controlPages = function (page) {
  if (isNaN(page)) return;
  paginationView.renderAll(model.pages(page));

  const reports = model.rowsPerPage(page);
  reportTableView.renderAll(reports);
};

const controlRenderAllReports = function () {
  const reports = model.rowsPerPage();
  reportTableView.renderAll(reports);
  paginationView.renderAll(model.pages());
};

const controlTheme = function (theme) {
  if (!theme) return;
  try {
    themeView.setTheme(model.switchTheme(theme));
    model.saveThemeInLocalStorage();
  } catch (error) {
    console.error(error);
    notificationView.error(error.message);
  }
};

const controlBeforeUnload = function () {
  let hasChanges;
  for (const [_, reportFormView] of reportTabsView.tabs) {
    if (reportFormView._changes.length > 0) {
      hasChanges = true;
      break;
    }
  }
  return hasChanges;
};

/*
 *************************************************************
 * INITIALIZE ALL HANDLERS, AND RENDER ALL EXISTING REPORTS  *
 *************************************************************
 */
const init = async function () {
  await model.init();

  // prettier-ignore
  if (model.migrateReport(model.state.reports)) {
    notificationView.success(`Reports successfully migrated to v1.0.0-beta`, 60);
    model.saveReportsInLocalStorage();
  }
  // api.sendBackupReports(model.state.reports);

  // Initialize all tabs
  reportTabsView.renderAll(model.initNumberOfTabs(5));
  reportFormView = reportTabsView.tabs.get(model.state.tab);

  // If id in hash render report
  if (window.location.hash.slice(1)) controlRenderReport();

  // Initialize all table rows per page
  model.state.rowsPerPage = paginationView.rowsPerPage();
  reportTableView.renderAll(model.rowsPerPage());
  reportTableView.updateTotalCount(model.state.reports);

  // Initialize all pagination buttons
  paginationView.renderAll(model.pages());

  // Theme view handler
  themeView.addHandlerSwitchTheme(controlTheme);
  themeView.setTheme(model.state.theme);

  // Tab view handlers
  reportTabsView.addHandlerClickTab(controlTabs);
  reportTabsView.addHandlerKeydown(controlTabs);
  reportTabsView.addHandlerBeforeUnload(controlBeforeUnload);

  // Report view handler render. Applies to every report views (targeting Window object)
  reportFormView.addHandlerRender(controlUnsavedReport, controlRenderReport);
  // ^^^ ERROR WHEN EDITING URL, OVERWRITING AN EXISTING REPORT ^^^

  // Report view handlers per tabs
  reportTabsView.tabs.forEach((reportFormView) => {
    reportFormView.addHandlerPaste(controlPaste);
    reportFormView.addHandlerCopy(controlCopy);
    reportFormView.addHandlerNew(controlUnsavedReport, controlNewReport);
    reportFormView.addHandlerSave(controlSaveReport);
    reportFormView.addHandlerSend(controlSendReport);
  });

  // Table view handlers
  reportTableView.addHandlerUniqueReportPerTab(
    controlUnsavedReport,
    controlUniqueReportPerTab
  );
  reportTableView.addHandlerSend(controlSendReport);
  reportTableView.addHandlerDelete(controlDeleteReport);

  // Search view handler
  searchView.addHandlerSearch(controlSearchResults);
  searchView.addHandlerClearSearch(controlClearSearchResults);

  // Pagination view handlers
  paginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
  paginationView.addHandlerClickPage(controlPages);

  // const version = await api.v1.version.getVersion();
  // console.log("Version", version);
  // tabsView._appVersion.textContent = version;
  console.log(model.state);
};

init();

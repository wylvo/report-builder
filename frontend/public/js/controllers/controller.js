import * as model from "../model/model.js";
import api from "../model/api.js";
import sidebarView from "../views/sidebarView.js";
import themeView from "../views/themeView.js";
import tabsView from "../views/tabsView.js";
import searchView from "../views/searchView.js";
import paginationView from "../views/paginationView.js";
import tableView from "../views/tableView.js";
import notificationView from "../views/notificationView.js";
import modalView from "../views/modalView.js";

let reportView,
  takeSnapshot = false;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  reportView = tabsView.tabs.get(model.state.tab);
  const reportId = id ? id : model.state.tabs.get(tabIndex).report.id;
  tabsView.updateLocationHash(reportId);
};

// prettier-ignore
const controlUniqueReportPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.report.id && tab.report.id === id) {
      const reportView = tabsView.tabs.get(index);
      if (!event) reportView._tab.firstElementChild.click();
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
    const reportInput = reportView._inputs.get("*").get(index);

    if (reportInput.getAttribute("type") === "checkbox") {
      if (reportInput.checked && !clipboardInput.checked) reportInput.click();
      if (!reportInput.checked && clipboardInput.checked) reportInput.click();
    }

    if (reportInput.getAttribute("type") !== "checkbox")
      reportInput.value = clipboardInput.value;
  });
  notificationView.success(`Report state pasted into tab ${model.state.tab + 1}`, 5);
  reportView._form.onchange();
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    tabsView.tabs.forEach((reportView) => reportView._btnPaste.disabled = false);
  notificationView.info(`Report state copied from tab ${model.state.tab + 1}`, 5);
};

const controlNewReport = function () {
  model.newReport(model.state.tab);
  reportView.newReport((takeSnapshot = true));
  tabsView.removeLocationHash();
};

const controlRenderReport = function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return controlNewReport();

    const isReportPresentInTab = controlUniqueReportPerTab(id);
    if (isReportPresentInTab) return;

    const report = model.loadReport(model.state.tab, id);
    reportView.render(report);
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
      report = await model.DB.createReport(model.state.tab, reportView._form);
      tableView.render(report);
      tableView.updateTotalReports(model.state.reports);
      notificationView.success(`Report successfully created: [${report.id}]`);
    }

    // Save changes
    if (id) {
      report = await model.DB.updateReport(id, reportView._form);
      tableView.update(report);
      notificationView.success(`Report changes were saved: [${report.id}]`);
    }

    reportView.takeSnapshot(reportView.newClone());
    reportView.updateTags(report);
    reportView._btnTeams.disabled = false;
    tabsView.render(model.state.tab, report.incident.title, report.id);
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
  const reportViewInTab = tabsView.tabs.get(tabIndex);
  const tableViewBtnTeams = report.tableRowEl.querySelector(".table-row-teams-btn");
  
  try {
    if (report.hasTriggeredWebhook)
      isPromptConfirmed = await modalView.confirmSend();
    if (!isPromptConfirmed) return;

    if(reportViewInTab) reportViewInTab.renderSpinner(reportViewInTab._btnTeams);
    tableView.renderSpinner(tableViewBtnTeams);

    const request = await api.sendTeamsWebhook(report);
    if(reportViewInTab) {
      reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "success");
      reportViewInTab._btnTeams.disabled = true;
    }

    tableView.clearSpinner(tableViewBtnTeams, "success");
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
    tableView.clearSpinner(tableViewBtnTeams);

    if (error.message.includes("Request failed")) {
      if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "error");
      tableView.clearSpinner(tableViewBtnTeams, "error");
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
    if(id === window.location.hash.slice(1)) tabsView.removeLocationHash();
  
    const tabIndex = model.findReportInTab(id);
    if (tabIndex) {
      model.newReport(tabIndex)
      tabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }
  
    await model.DB.deleteReport(id);
    tableView.updateTotalReports(model.state.reports);
    notificationView.success(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

  } catch (error) {
    notificationView.error(error, 60);
  }
};

// prettier-ignore
const controlUnsavedReport = async (controlFunction, handler = undefined, event = undefined) => {
  let isSaveConfirmed = false;
  const currentReportView = tabsView.tabs.get(model.state.tab);

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
    tableView.updateTotalReports(model.state.reports);
    return tableView.renderAll(model.rowsPerPage());
  }

  const filterBy = searchView.filterBy();
  model.filterSearch(query, filterBy);

  controlRenderAllReports();
  tableView.updateTotalReports(model.state.search.results);
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
  tableView.renderAll(reports);
};

const controlRenderAllReports = function () {
  const reports = model.rowsPerPage();
  tableView.renderAll(reports);
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
  for (const [_, reportView] of tabsView.tabs) {
    if (reportView._changes.length > 0) {
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
  tabsView.renderAll(model.initNumberOfTabs(5));
  reportView = tabsView.tabs.get(model.state.tab);

  // If id in hash render report
  if (window.location.hash.slice(1)) controlRenderReport();

  // Initialize all table rows per page
  model.state.rowsPerPage = paginationView.rowsPerPage();
  tableView.renderAll(model.rowsPerPage());
  tableView.updateTotalReports(model.state.reports);

  // Initialize all pagination buttons
  paginationView.renderAll(model.pages());

  // Theme view handler
  themeView.addHandlerSwitchTheme(controlTheme);
  themeView.setTheme(model.state.theme);

  // Tab view handlers
  tabsView.addHandlerClickTab(controlTabs);
  tabsView.addHandlerKeydown(controlTabs);
  tabsView.addHandlerBeforeUnload(controlBeforeUnload);

  // Report view handler render. Applies to every report views (targeting Window object)
  reportView.addHandlerRender(controlUnsavedReport, controlRenderReport);
  // ^^^ ERROR WHEN EDITING URL, OVERWRITING AN EXISTING REPORT ^^^

  // Report view handlers per tabs
  tabsView.tabs.forEach((reportView) => {
    reportView.addHandlerPaste(controlPaste);
    reportView.addHandlerCopy(controlCopy);
    reportView.addHandlerNew(controlUnsavedReport, controlNewReport);
    reportView.addHandlerSave(controlSaveReport);
    reportView.addHandlerSend(controlSendReport);
  });

  // Table view handlers
  tableView.addHandlerUniqueReportPerTab(
    controlUnsavedReport,
    controlUniqueReportPerTab
  );
  tableView.addHandlerSend(controlSendReport);
  tableView.addHandlerDelete(controlDeleteReport);

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

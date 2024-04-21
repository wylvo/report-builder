import * as model from "../model.js";
import api from "../api.js";

import reportTabsView from "./views/reportTabsView.js";
import reportTableView from "./views/reportTableView.js";

import paginationView from "../_views/paginationView.js";
import searchView from "../_views/searchView.js";
import notificationsView from "../notifiations/notificationsView.js";

import ModalFormView from "../modal/modalFormView.js";
import ModalView from "../modal/modalView.js";

const modalView = new ModalView();

let modalFormView = new ModalFormView(),
  reportFormView,
  takeSnapshot = false;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  reportFormView = reportTabsView.tabs.get(model.state.tab);
  const reportId = id ? id : model.state.tabs.get(tabIndex).data.id;
  reportTabsView.updateLocationHash(reportId);
};

// prettier-ignore
const controlUniqueReportPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.data.id && tab.data.id === id) {
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
  notificationsView.success(`Report state pasted into tab ${model.state.tab + 1}`, 5);
  reportFormView._form.onchange();
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    reportTabsView.tabs.forEach((reportFormView) => reportFormView._btnPaste.disabled = false);
  notificationsView.info(`Report state copied from tab ${model.state.tab + 1}`, 5);
};

const controlNewReport = function () {
  model.clearTab(model.state.tab);
  reportFormView.newReport((takeSnapshot = true));
  reportTabsView.removeLocationHash();
};

const controlRenderReport = function () {
  try {
    const id = window.location.hash.slice(1);
    if (!id) return controlNewReport();

    const isReportPresentInTab = controlUniqueReportPerTab(id);
    if (isReportPresentInTab) return;

    const report = model.loadTabWith(model.state.reports, model.state.tab, id);
    reportFormView.render(report);
    console.log(model.state);
  } catch (error) {
    controlNewReport();
    notificationsView.error(error.message, 60);
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
      notificationsView.success(`Report successfully created: [${report.id}]`);
    }

    // Save changes
    if (id) {
      report = await model.DB.updateReport(id, reportFormView._form);
      reportTableView.update(report);
      notificationsView.success(`Report changes were saved: [${report.id}]`);
    }

    reportFormView.takeSnapshot(reportFormView.newClone());
    reportFormView.updateTags(report);
    reportFormView._btnTeams.disabled = false;
    reportTabsView.render(model.state.tab, report.incident.title, report.id);
    model.loadTabWith(model.state.reports, model.state.tab, report.id);
    // api.sendBackupReports(model.state.reports);
  } catch (error) {
    notificationsView.error(error.message, 60);
    console.error(error);
  }
};

// prettier-ignore
const controlSendReport = async function (id = undefined) {
  const hasIdInHash = window.location.hash.slice(1);
  let isPromptConfirmed = true;
  if (!id && hasIdInHash) id = hasIdInHash;

  const report = model.findObjectById(model.state.reports, id);
  const tabIndex = model.findTabIndexByObjectId(report.id);
  const reportViewInTab = reportTabsView.tabs.get(tabIndex);
  const tableViewBtnTeams = report.tableRowEl.querySelector(".teams");
  
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
    notificationsView.success(`Report successfully sent on Teams. Status code ${request.response.status} (${request.response.statusText})`);

    model.updateIsWebhookSent(report);
    model.updateHasTriggeredWebhook(report);

    console.log("Local:", JSON.parse(localStorage.getItem("reportsList")));
    console.log("Model:", model.state);
    console.log("Tab index:", tabIndex, model.state.tabs.get(tabIndex).report);
  } catch (error) {
    console.error(error);
    notificationsView.error(error, 60);
    if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams);
    reportTableView.clearSpinner(tableViewBtnTeams);

    if (error.message.includes("Request failed")) {
      if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "error");
      reportTableView.clearSpinner(tableViewBtnTeams, "error");
      notificationsView.warning("Make sure you have internet access.", 60);
    }
  }
};

// prettier-ignore
const controlDeleteReport = async function (id) {
  try {
    const report = model.findObjectById(model.state.reports, id);
    const isAdmin = model.state.user.role === "admin"
    let isDeleteConfirmed = true;

    // if current user is admin, propose hard delete option
    if (isAdmin) {
      modalFormView = await modalView.confirmDeleteOrHardDelete(report);
      
      if (modalFormView instanceof ModalFormView)
        return modalFormView.addHandlerConfirmPassword(id, controlHardDeleteReport);

    } else isDeleteConfirmed = await modalView.confirmDelete(report);

    if (!isDeleteConfirmed || !modalFormView) return;

    // Remove id if in hash
    if (id === window.location.hash.slice(1)) reportTabsView.removeLocationHash();
  
    // Clear report if in tab
    const tabIndex = model.findTabIndexByObjectId(id);
    if (tabIndex !== -1) {
      model.clearTab(tabIndex)
      reportTabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }

    // Api call to soft delete a report in the database
    await model.DB.deleteReport(id);
    
    reportTableView.updateTotalCount(model.state.reports);
    notificationsView.success(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

    await model.DB.getAllSoftDeletedReports();
    if(reportTableView.isDeletedViewActive)
      reportTableView.renderAll(model.state.reportsDeleted)

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

// prettier-ignore
const controlHardDeleteReport = async function (id, password) {
  try {
    const report = model.findObjectById(model.state.reports, id);
  
    // Remove id if in hash
    if(id === window.location.hash.slice(1)) reportTabsView.removeLocationHash();
  
    // Clear report if in tab
    const tabIndex = model.findTabIndexByObjectId(id);
    if (tabIndex !== -1) {
      model.clearTab(tabIndex)
      reportTabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }

    // Api call to hard delete a report in the database
    await model.DB.hardDeleteReport(id, password);

    modalView.closeModal();
    reportTableView.updateTotalCount(model.state.reports);
    notificationsView.success(`Report successfully hard deleted: ${report.incident.title} [${report.id}]`);

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

// prettier-ignore
const controlUndoDeleteReport = async function (id) {
  try {
    const reportDeleted = model.findObjectById(model.state.reportsDeleted, id);

    let isUndoConfirmed = true;
    isUndoConfirmed = await modalView.confirmUndo(reportDeleted);
    if (!isUndoConfirmed) return;

    await model.DB.undoSoftDeleteReport(id);
    reportTableView.updateTotalCount(model.state.reportsDeleted);
    notificationsView.undo(
      `Deleted report successfully recovered: ${reportDeleted.incident.title} [${reportDeleted.id}]`
    );

    await model.DB.getReports();
    if(!reportTableView.isDeletedViewActive)
      reportTableView.renderAll(model.state.reports)

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
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

  const reports = reportTableView.isDeletedViewActive
    ? model.state.reportsDeleted
    : model.state.reports;

  const query = searchView.query();
  if (!query) {
    return controlClearSearchResults();
  }

  const filterBy = searchView.filterBy();
  model.filterSearch(reports, query, filterBy);

  controlRenderAllReports();
  reportTableView.updateTotalCount(model.state.search.results);
};

const controlClearSearchResults = function () {
  model.state.search.query = "";
  model.state.search.results = [];
  searchView.clearQuery();
  return controlRenderAllReports();
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
  const reports = reportTableView.isDeletedViewActive
    ? model.state.reportsDeleted
    : model.state.reports;

  const rowsOfReports = model.rowsPerPage(reports);
  const pages = model.pages();

  reportTableView.renderAll(rowsOfReports);
  paginationView.renderAll(pages);
  reportTableView.updateTotalCount(reports);

  return reports;
};

const controlImportReports = async function (rawJSON) {
  try {
    const reportsArray = JSON.parse(rawJSON);
    let errors = false;

    // Check if raw JSON is an array and is not empty
    if (!Array.isArray(reportsArray) || reportsArray.length === 0)
      return notificationsView.warning(
        "JSON can't be empty, and has to be enclosed by an array -> []"
      );

    // Check report validity of each values inside the non-empty array
    reportsArray.forEach((report, i) => {
      try {
        model.checkValidity(report);
      } catch (error) {
        errors = true;
        notificationsView.error(`Report #${i + 1}: ${error.message}`);
      }
    });

    if (errors) return;

    // prettier-ignore
    // Filter report objects with duplicate "id" values
    const uniqueReportsArray = reportsArray.filter((value, i, array) =>
      i === array.findIndex((obj) => obj.id === value.id));

    console.log(uniqueReportsArray);

    await model.DB.importReports(uniqueReportsArray);

    notificationsView.import(
      `Report(s) successfully imported: ${uniqueReportsArray.length}`
    );
    modalView.closeModal();
  } catch (error) {
    notificationsView.error(error.message, 60);
    console.error(error);
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
export const init = async function () {
  await model.init();

  // prettier-ignore
  if (model.migrateReport(model.state.reports)) {
    notificationsView.success(`Reports successfully migrated to v1.0.0-beta`, 60);
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
  reportTableView.renderAll(model.rowsPerPage(model.state.reports));
  reportTableView.updateTotalCount(model.state.reports);

  // Initialize all pagination buttons
  paginationView.renderAll(model.pages());

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
  reportTableView.addHandlerClickAllDeletedReports(
    controlRenderAllReports,
    controlClearSearchResults
  );
  reportTableView.addHandlerClickAllReports(
    controlRenderAllReports,
    controlClearSearchResults
  );
  reportTableView.addHandlerUniqueReportPerTab(
    controlUnsavedReport,
    controlUniqueReportPerTab
  );
  reportTableView.addHandlerSend(controlSendReport);
  reportTableView.addHandlerDelete(controlDeleteReport);
  reportTableView.addHandlerUndoDelete(controlUndoDeleteReport);

  // Search view handler
  searchView.addHandlerSearch(controlSearchResults);
  searchView.addHandlerClearSearch(controlClearSearchResults);

  // Pagination view handlers
  paginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
  paginationView.addHandlerClickPage(controlPages);

  // Modal form view handler
  modalFormView.addHandlerClickImportReports(controlImportReports);

  // const version = await api.v1.version.getVersion();
  // console.log("Version", version);
  // tabsView._appVersion.textContent = version;
  console.log(model.state);
};

init();

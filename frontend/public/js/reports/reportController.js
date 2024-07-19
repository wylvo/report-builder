import * as model from "./reportModel.js";
import api, { isRequestInProgress } from "../api.js";

import reportTabsView from "./views/reportTabsView.js";
import reportTableView from "./views/reportTableView.js";

import paginationView from "../_views/paginationView.js";
import searchView from "../_views/searchView.js";
import notificationsView from "../_views/notificationsView.js";

import ModalFormView from "../_views/modalFormView.js";
import ModalView from "../_views/modalView.js";

const modalView = new ModalView();

let modalFormView = new ModalFormView(),
  takeSnapshot = false;

export let reportFormView;

const controlTabs = function (tabIndex, id = undefined) {
  model.state.tab = tabIndex;
  reportFormView = reportTabsView.tabs.get(model.state.tab);
  const reportId = id ? id : model.state.tabs.get(tabIndex).data.id;
  reportTabsView.updateLocationHash(reportId);
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

// prettier-ignore
const controlUnsavedReport = async (controlFunction, handler = undefined, event = undefined) => {
  let isSaveConfirmed = false;
  const currentReportView = reportTabsView.tabs.get(model.state.tab);
  const formHasChanges = currentReportView._changes.length > 0;

  if (formHasChanges) {
    if (event) event.preventDefault();
    isSaveConfirmed = await modalView.confirmSave();
  }
  if (isSaveConfirmed) {
    const id = window.location.hash.slice(1);
    if (formHasChanges) return controlSaveReport(id);
  }

  if (typeof handler === "function") {
    const returnedValue = handler();
    if (returnedValue !== null || typeof returnedValue !== "undefined")
      return controlFunction(returnedValue, event);
  }
  return controlFunction(handler, event);
};

// prettier-ignore
const controlUniqueReportPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.data.id && tab.data.id === Number(id)) {
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

    // For checkbox elements
    if (reportInput.getAttribute("type") === "checkbox") {
      if (reportInput.checked && !clipboardInput.checked) reportInput.click();
      if (!reportInput.checked && clipboardInput.checked) reportInput.click();
    }

    // Check for multiselect elements and paste/set the selected value of each elements
    if (reportInput.hasAttribute("multiple")) {
      const reportInputMultiselectOptions = [...reportInput.options];
      reportInputMultiselectOptions.forEach((option, i) => {
        const clipboardInputOption = clipboardInput.options[i];
        const isSameValue = option.value === clipboardInputOption.value;
        
        if (isSameValue)
          option.selected = clipboardInputOption.selected
      });

    // Everything else that is not a checkbox or a select with a mutiple attribute
    } else if (reportInput.getAttribute("type") !== "checkbox")
      reportInput.value = clipboardInput.value;
  });
  // Load multiselections for all multiselects elements
  reportFormView._multiselects.forEach((multiselects) => multiselects.loadOptions());

  notificationsView.success(`Report state pasted into tab ${model.state.tab + 1}`, 5);
  reportFormView._form.onchange();
};

// prettier-ignore
const controlCopy = function (inputs = undefined) {
  model.state.clipboard = inputs;
  if (model.state.clipboard.size > 0)
    reportTabsView.tabs.forEach((reportFormView) => reportFormView._btnPaste.disabled = false);
};

const controlUnhighlightReport = function (tabIndex) {
  const report = model.state.tabs.get(tabIndex).data;
  if (report.tableRowEl) reportTableView.unhighlight(report.tableRowEl);
};

const controlNewReport = function () {
  controlUnhighlightReport(model.state.tab);

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

    const reports = reportTableView.isDeletedViewActive
      ? model.state.reportsDeleted
      : model.state.reports;

    const index = model.findObjectIndexById(reports, id, false);
    const reportFound = index !== -1;
    let report;

    if (!reportFound) return reportTabsView.removeLocationHash();

    if (reportFound) {
      controlUnhighlightReport(model.state.tab);

      report = model.loadTab(reports[index], model.state.tab);
      reportFormView.render(report);

      reportTableView.highlight(report.tableRowEl);
    }
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    controlNewReport();
  }
};

const controlSearchResults = function () {
  model.state.search.page = 1;
  model.state.search.pageDeletedView = 1;

  const reports = reportTableView.isDeletedViewActive
    ? model.state.reportsDeleted
    : model.state.reports;

  const query = searchView.query();
  if (!query) return controlClearSearchResults(query);

  const filterBy = searchView.filterBy();
  model.filterSearch(reports, query, filterBy);

  controlRenderAllReports();
  reportTableView.updateResultCount(model.state.search.results);
};

const controlClearSearchResults = function (query) {
  const isAlreadyEmptyQuery = model.state.search.query === "" || query !== "";
  if (isAlreadyEmptyQuery) return;

  // Clear the query
  model.state.search.query = "";
  model.state.search.results = [];
  searchView.clearQuery();
  reportTableView.updateResultCount(0);

  return controlRenderAllReports();
};

const controlRenderAllReports = function () {
  const query = model.state.search.query;
  const reports = query
    ? {
        array: model.state.search.results,
        total: model.state.search.results.length,
      }
    : reportTableView.isDeletedViewActive
    ? {
        array: model.state.reportsDeleted,
        total: model.state.reportsDeletedTotal,
        page: model.state.search.pageDeletedView,
      }
    : {
        array: model.state.reports,
        total: model.state.reportsTotal,
        page: model.state.search.page,
      };

  const pageBtns = model.pages(reports.total, reports.page);

  paginationView.renderAll(pageBtns);
  reportTableView.renderAll(reports.array);
  query
    ? reportTableView.updateResultCount(reports.total)
    : reportTableView.updateTotalCount(reports.total);

  return reports.array;
};

const controlRowsPerPage = async function (rowsPerPage) {
  model.state.rowsPerPage = rowsPerPage;
  model.state.search.page = 1;
  model.state.search.pageDeletedView = 1;

  try {
    reportTableView.renderTableSpinner();

    reportTableView.isDeletedViewActive
      ? await model.DB.getAllSoftDeletedReports(
          model.state.search.pageDeletedView,
          model.state.rowsPerPage
        )
      : await model.DB.getAllReports(
          model.state.search.page,
          model.state.rowsPerPage
        );

    const query = searchView.query();
    if (query) return controlSearchResults();

    controlRenderAllReports();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

const controlPages = async function (page) {
  if (isNaN(page)) return;

  try {
    reportTableView.renderTableSpinner();

    if (reportTableView.isDeletedViewActive) {
      await model.DB.getAllSoftDeletedReports(page, model.state.rowsPerPage);
      model.state.search.pageDeletedView = page;
    }

    if (!reportTableView.isDeletedViewActive) {
      await model.DB.getAllReports(page, model.state.rowsPerPage);
      model.state.search.page = page;
    }

    controlRenderAllReports();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

// prettier-ignore
const controlSaveReport = async function (reportId) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");
  
  const id = reportId ? reportId : window.location.hash.slice(1);
  let report, reportFound = true;
  try {
    reportFormView.renderSpinner(reportFormView._btnSubmit);

    // Create report
    if (!id) {
      report = await model.DB.createReport(model.state.tab, reportFormView._form);
      reportTableView.render(report);
      model.state.reportsTotal++;
      reportTableView.updateTotalCount(model.state.reportsTotal);
    }

    // Update report
    if (id) {
      [reportFound, report] = await model.DB.updateReport(id, reportFormView._form);
      if (report.tableRowEl) reportTableView.update(report);
    }

    notificationsView.success(`Report successfully ${id ? "updated" : "created"}: [${report.id}]`);

    // Update form state
    reportFormView.render(report);
    reportFormView.takeSnapshot(reportFormView.newClone());

    // Update tab state
    reportTabsView.render(model.state.tab, report.incident.title, report.id);
    if (!reportFound) model.loadTab(report, model.state.tab);
    if (reportFound) model.loadTabWith(model.state.reports, model.state.tab, report.id);

    reportFormView.clearSpinner(reportFormView._btnSubmit, "success", id ? "update" : "save");

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    reportFormView.clearSpinner(reportFormView._btnSubmit, "error", id ? "update" : "save");
  }
};

// prettier-ignore
const controlSendReport = async function (id = undefined) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");
  
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

    const { data } = await api.v1.webhook.sendReportToIncomingWebhook(id);

    report.hasTriggeredWebhook = data.data.hasTriggeredWebhook
    console.log(data);

    if(data.webhook) {
      if (data.webhook.response.statusCode >= 300) {
        if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "warning", "teams");
          reportTableView.clearSpinner(tableViewBtnTeams, "warning", "teams");
          notificationsView.warning(`
            Received unsuccessful response from incoming webhook. Status code: ${data.webhook.response.statusCode} (${data.webhook.response.statusText})`, 60
          );
          return;
      }

      report.isWebhookSent = data.data.isWebhookSent

      if(reportViewInTab) {
        reportViewInTab.clearSpinner(reportViewInTab._btnTeams, "success", "teams");
        reportViewInTab._btnTeams.disabled = true;
      }
      
      reportTableView.clearSpinner(tableViewBtnTeams, "success", "teams");
      tableViewBtnTeams.disabled = true;
      notificationsView.success(`Report successfully sent on Teams. Status code: ${data.webhook.response.status} (${data.webhook.response.statusText})`);
      return;
    }
    // reportTableView.clearSpinner(tableViewBtnTeams, "error");
    // notificationsView.warning(`Failed to send a report to an incoming webhook. ${data.webhook.response.status} (${data.webhook.response.statusText}`, 60);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    if(reportViewInTab) reportViewInTab.clearSpinner(reportViewInTab._btnTeams);
    reportTableView.clearSpinner(tableViewBtnTeams);
  }
};

// prettier-ignore
const controlDeleteReport = async function (id) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");
  
  let reportTableRowDeleteBtn;

  try {
    let isDeleteConfirmed = true;

    const report = model.findObjectById(model.state.reports, id);
    const isAdmin = model.state.user.role === "Admin";
    const hasIdInHash = id === window.location.hash.slice(1);

    reportTableRowDeleteBtn = report.tableRowEl.querySelector(".delete");
        
    // if current user is admin, propose hard delete option
    if (isAdmin) {
      modalFormView = await modalView.confirmDeleteOrHardDelete(report);
      
      if (modalFormView instanceof ModalFormView)
        return modalFormView.addHandlerConfirmPassword(id, controlHardDeleteReport);

    } else isDeleteConfirmed = await modalView.confirmDelete(report);

    if (!isDeleteConfirmed || !modalFormView) return;

    // Remove id if in hash
    if (hasIdInHash) reportTabsView.removeLocationHash();
  
    // Clear report if in tab
    const tabIndex = model.findTabIndexByObjectId(id);
    const tabFound = tabIndex !== -1;
    if (tabFound) {
      model.clearTab(tabIndex)
      reportTabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }

    reportTableView.renderSpinner(reportTableRowDeleteBtn);

    // Api call to soft delete a report in the database
    await model.DB.softDeleteReport(id);

    model.state.reportsTotal--;
    reportTableView.updateTotalCount(model.state.reportsTotal);
    notificationsView.delete(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

    await model.DB.getAllSoftDeletedReports(model.state.search.page, model.state.rowsPerPage);
    if(reportTableView.isDeletedViewActive)
      reportTableView.renderAll(model.state.reportsDeleted)

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    reportTableView.clearSpinner(reportTableRowDeleteBtn, null, "delete");
  }
};

// prettier-ignore
const controlHardDeleteReport = async function (id, password) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");
  
  let reportTableRowDeleteBtn;

  try {
    const report = model.findObjectById(model.state.reports, id);
    const hasIdInHash = id === window.location.hash.slice(1);
    
    reportTableRowDeleteBtn = report.tableRowEl.querySelector(".delete");
  
    // Remove id if in hash
    if (hasIdInHash) reportTabsView.removeLocationHash();
  
    // Clear report if in tab
    const tabIndex = model.findTabIndexByObjectId(id);
    const tabFound = tabIndex !== -1;
    if (tabFound) {
      model.clearTab(tabIndex)
      reportTabsView.tabs.get(tabIndex).newReport((takeSnapshot = true))
    }

    reportTableView.renderSpinner(reportTableRowDeleteBtn);

    // Api call to hard delete a report in the database
    await model.DB.hardDeleteReport(id, password);

    modalView.closeModal();
    model.state.reportsTotal--;
    reportTableView.updateTotalCount(model.state.reportsTotal);
    notificationsView.delete(`Report successfully hard deleted: ${report.incident.title} [${report.id}]`);

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    reportTableView.clearSpinner(reportTableRowDeleteBtn, null, "delete");
  }
};

// prettier-ignore
const controlUndoDeleteReport = async function (id) {
  if (isRequestInProgress) return notificationsView.warning("A request is already in progress.");
  
  let reportTableRowUndoBtn;
  try {
    let isUndoConfirmed = true;
    const reportDeleted = model.findObjectById(model.state.reportsDeleted, id);
    reportTableRowUndoBtn = reportDeleted.tableRowEl.querySelector(".undo");

    isUndoConfirmed = await modalView.confirmUndo(reportDeleted);
    if (!isUndoConfirmed) return;

    reportTableView.renderSpinner(reportTableRowUndoBtn);

    await model.DB.undoSoftDeleteReport(id);
    
    model.state.reportsDeletedTotal--;
    reportTableView.updateTotalCount(model.state.reportsDeletedTotal);
    notificationsView.undo(
      `Deleted report successfully recovered: ${reportDeleted.incident.title} [${reportDeleted.id}]`
    );

    await model.DB.getAllReports(model.state.search.page, model.state.rowsPerPage);
    if(!reportTableView.isDeletedViewActive)
      reportTableView.renderAll(model.state.reports)

  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    reportTableView.clearSpinner(reportTableRowUndoBtn, null, "undo");
  }
};

const controlImportReports = async function (rawJSON) {
  if (isRequestInProgress)
    return notificationsView.warning("A request is already in progress.");

  try {
    let hasErrors = false;
    const unmigratedReports = JSON.parse(rawJSON);

    // Check if raw JSON is an array and is not empty
    if (!Array.isArray(unmigratedReports) || unmigratedReports.length === 0)
      return notificationsView.warning(
        "JSON can't be empty, and has to be enclosed by an array -> []"
      );

    const migratedReports = await model.DB.migrateReports(unmigratedReports);

    // Check report validity of each values inside the non-empty array
    migratedReports.forEach((report, i) => {
      try {
        report.tableRowEl = {};
        model.checkReportValidity(model.DEFAULT_REPORT_IMPORT, report);
      } catch (error) {
        hasErrors = true;
        notificationsView.error(`Report ${i + 1}: ${error.message}`);
      }
    });

    if (hasErrors) return;

    const reportIds = await model.DB.importReports(migratedReports);

    console.log(reportIds);

    notificationsView.import(
      `Report(s) successfully imported: ${reportIds.length}`
    );
    modalView.closeModal();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

/*
 *************************************************************
 * INITIALIZE ALL HANDLERS, AND RENDER ALL EXISTING REPORTS  *
 *************************************************************
 */
const init = async function () {
  try {
    await model.init();

    // Initialize all tabs
    reportTabsView.renderAll(model.state.formData, model.initNumberOfTabs(5));
    reportFormView = reportTabsView.tabs.get(model.state.tab);
    reportTableView.loadUsers(model.state.usersFrontend);

    model.state.search.pageDeletedView = 1;

    // Initialize all table rows per page
    model.state.rowsPerPage = paginationView.rowsPerPage();
    controlRenderAllReports();

    // If id in hash render report
    if (window.location.hash.slice(1)) controlRenderReport();

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

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
};

init();

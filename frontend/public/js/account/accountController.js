import * as model from "./accountModel.js";
import { isRequestInProgress } from "../api.js";

import accountTabsView from "./views/accountTabsView.js";

import searchView from "../_views/searchView.js";
import paginationView from "../_views/paginationView.js";
import reportTableView from "../reports/views/reportTableView.js";
import notificationsView from "../_views/notificationsView.js";

import ModalFormView from "../_views/modalFormView.js";
import ModalView from "../_views/modalView.js";

const modalView = new ModalView();

let modalFormView = new ModalFormView(),
  accountFormView;

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
    if (hasIdInHash) accountTabsView.removeLocationHash();

    reportTableView.renderSpinner(reportTableRowDeleteBtn);

    // Api call to soft delete a report in the database
    await model.DB.softDeleteReport(id);

    model.state.reportsTotal--;
    reportTableView.updateTotalCount(model.state.reportsTotal);
    notificationsView.delete(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

    await model.DB.getCurrentUserAccount();
    model.state.reports = model.state.user.reports;
    model.state.reportsDeleted = model.state.user.reportsDeleted;

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
    if (hasIdInHash) accountTabsView.removeLocationHash();

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

const controlUndoDeleteReport = async function (id) {
  if (isRequestInProgress)
    return notificationsView.warning("A request is already in progress.");

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

    await model.DB.getCurrentUserAccount();
    model.state.reports = model.state.user.reports;
    model.state.reportsDeleted = model.state.user.reportsDeleted;
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
    reportTableView.clearSpinner(reportTableRowUndoBtn, null, "undo");
  }
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
      }
    : { array: model.state.reports, total: model.state.reportsTotal };

  const pageBtns = model.pages(reports.total);

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

  try {
    reportTableView.renderTableSpinner();

    await model.DB.getReports();

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
    model.state.search.page = page;

    await model.DB.getReports();

    controlRenderAllReports();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
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

    // Initialize user reports
    model.state.reports = model.state.user.reports;
    model.state.reportsTotal = model.state.user.reportsTotal;
    model.state.reportsDeleted = model.state.user.reportsDeleted;
    model.state.reportsDeletedTotal = model.state.user.reportsDeletedTotal;

    // Initialize the single tab
    accountTabsView.renderAll(null, model.initNumberOfTabs(1));
    accountFormView = accountTabsView.tabs.get(model.state.tab);
    accountFormView.render(model.state.user);

    // Initialize table & rows per page
    model.state.rowsPerPage = paginationView.rowsPerPage();
    controlRenderAllReports();

    // Table view handlers
    reportTableView.addHandlerClickAllDeletedReports(
      controlRenderAllReports,
      controlClearSearchResults
    );
    reportTableView.addHandlerClickAllReports(
      controlRenderAllReports,
      controlClearSearchResults
    );

    // reportTableView.addHandlerSend(controlSendReport);
    reportTableView.addHandlerDelete(controlDeleteReport);
    reportTableView.addHandlerUndoDelete(controlUndoDeleteReport);

    // Search view handler
    searchView.addHandlerSearch(controlSearchResults);
    searchView.addHandlerClearSearch(controlClearSearchResults);

    // Pagination view handlers
    paginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
    paginationView.addHandlerClickPage(controlPages);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

init();

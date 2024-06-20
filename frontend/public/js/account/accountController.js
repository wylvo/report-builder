import * as model from "./accountModel.js";

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
  try {
    const report = model.findObjectById(model.state.reports, id);
    const isAdmin = model.state.user.role === "Admin"
    let isDeleteConfirmed = true;

    // if current user is admin, propose hard delete option
    if (isAdmin) {
      modalFormView = await modalView.confirmDeleteOrHardDelete(report);
      
      if (modalFormView instanceof ModalFormView)
        return modalFormView.addHandlerConfirmPassword(id, controlHardDeleteReport);

    } else isDeleteConfirmed = await modalView.confirmDelete(report);

    if (!isDeleteConfirmed || !modalFormView) return;

    // Remove id if in hash
    if (id === window.location.hash.slice(1)) accountTabsView.removeLocationHash();

    // Api call to soft delete a report in the database
    await model.DB.softDeleteReport(id);
    
    reportTableView.updateTotalCount(model.state.reports);
    notificationsView.success(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

    await model.DB.getCurrentUserAccount();
    model.state.reports = model.state.user.reports;
    model.state.reportsDeleted = model.state.user.reportsDeleted;

    controlRenderAllReports();
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
    if(id === window.location.hash.slice(1)) accountTabsView.removeLocationHash();

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

    await model.DB.getCurrentUserAccount();
    model.state.reports = model.state.user.reports;
    model.state.reportsDeleted = model.state.user.reportsDeleted;

    controlRenderAllReports();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message, 60);
  }
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

  controlRenderAllReports();
};

export const init = async function () {
  try {
    await model.init();

    // Initialize user reports
    model.state.reports = model.state.user.reports;
    model.state.reportsDeleted = model.state.user.reportsDeleted;

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

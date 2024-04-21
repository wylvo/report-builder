import * as model from "../model/model.js";
import accountTabsView from "./views/accountTabsView.js";

import reportTableView from "../reports/views/reportTableView.js";
import searchView from "../_views/searchView.js";

import paginationView from "../_views/paginationView.js";
import notificationsView from "../notifiations/notificationsView.js";

import ModalFormView from "../modal/modalFormView.js";
import ModalView from "../modal/modalView.js";

const modalView = new ModalView();

let accountFormView,
  takeSnapshot = false;

// prettier-ignore
const controlDeleteReport = async function (id) {
  try {    
    const report = model.findObjectById(model.state.reports, id);
  
    let isDeleteConfirmed = true;
    isDeleteConfirmed = await modalView.confirmDelete(report);
    if(!isDeleteConfirmed) return;
  
    await model.DB.deleteReport(id);
    reportTableView.updateTotalCount(model.state.reports);
    notificationsView.success(`Report successfully deleted: ${report.incident.title} [${report.id}]`);

  } catch (error) {
    notificationsView.error(error, 60);
  }
};

const controlUndoDeleteReport = async function (id) {
  try {
    let isUndoConfirmed = true;
    isUndoConfirmed = await modalView.confirmDelete(report);
    if (!isUndoConfirmed) return;
  } catch (error) {
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

  const reports = model.rowsPerPage(page);
  reportTableView.renderAll(reports);
};

export const init = async function () {
  await model.init();

  // Initialize user reports
  model.state.reports = model.state.user.reports;
  model.state.reportsDeleted = model.state.user.reportsDeleted;

  // Initialize the single tab
  accountTabsView.renderAll(model.initNumberOfTabs(1));
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
};

init();

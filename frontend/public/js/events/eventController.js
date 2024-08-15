import * as model from "./eventModel.js";

import activityLogTableView from "./views/activityLogTableView.js";
import activityLogPaginationView from "./views/activityLogPaginationView.js";
import activityLogSearchView, {
  ActivityLogSearchView,
} from "./views/activityLogSearchView.js";
import authenticationLogTableView from "./views/authenticationLogTableView.js";
import authenticationLogPaginationView from "./views/authenticationLogPaginationView.js";
import authenticationLogSearchView, {
  AuthenticationLogSearchView,
} from "./views/authenticationLogSearchView.js";
import notificationsView from "../_views/notificationsView.js";

const controlView = function (targetView) {
  let logs,
    logsTotal,
    tableView,
    searchView,
    paginationView,
    rowsPerPage,
    page,
    getFunction;

  if (targetView instanceof ActivityLogSearchView) {
    logs = model.state.activityLogs;
    logsTotal = model.state.activityLogsTotal;
    tableView = activityLogTableView;
    searchView = activityLogSearchView;
    paginationView = activityLogPaginationView;
    rowsPerPage = model.state.rowsPerPage;
    page = model.state.search.page;
    getFunction = model.DB.getActivityLogs;
  } else if (targetView instanceof AuthenticationLogSearchView) {
    logs = model.state.authenticationLogs;
    logsTotal = model.state.authenticationLogsTotal;
    tableView = authenticationLogTableView;
    searchView = authenticationLogSearchView;
    paginationView = authenticationLogPaginationView;
    rowsPerPage = model.state.rowsPerPageAuthenticationLogs;
    page = model.state.search.pageAuthenticationLogs;
    getFunction = model.DB.getAuthenticationLogs;
  }

  return {
    logs: { array: logs, total: logsTotal, rowsPerPage, page },
    tableView,
    searchView,
    paginationView,
    getFunction,
  };
};

const controlSearchResults = function (targetView) {
  const { logs, tableView, searchView } = controlView(targetView);

  model.state.search.page = 1;

  const query = searchView.query();
  if (!query) return controlClearSearchResults(targetView, query);

  const filterBy = searchView.filterBy();
  model.filterSearch(logs.array, query, filterBy);

  controlRenderAllLogs(targetView);
  tableView.updateTotalCount(model.state.search.results);
};

const controlClearSearchResults = function (targetView, query) {
  const { tableView, searchView } = controlView(targetView);

  const isAlreadyEmptyQuery = model.state.search.query === "" || query !== "";
  if (isAlreadyEmptyQuery) return;

  // Clear the query
  model.state.search.query = "";
  model.state.search.results = [];
  searchView.clearQuery();
  tableView.updateResultCount(0);

  return controlRenderAllLogs(targetView);
};

const controlRenderAllLogs = function (targetView) {
  const { logs, tableView, paginationView } = controlView(targetView);

  const query = model.state.search.query;
  const queryLogs = query
    ? {
        array: model.state.search.results,
        total: model.state.search.results.length,
      }
    : logs;
  const pageBtns = model.pages(queryLogs.total, queryLogs.page);

  paginationView.renderAll(pageBtns);
  tableView.renderAll(queryLogs.array);
  query
    ? tableView.updateResultCount(queryLogs.total)
    : tableView.updateTotalCount(queryLogs.total);

  return queryLogs.array;
};

const controlRowsPerPage = async function (rowsPerPage, targetView) {
  const { logs, tableView, searchView, getFunction } = controlView(targetView);

  model.state.rowsPerPage = rowsPerPage;
  model.state.rowsPerPageAuthenticationLogs = rowsPerPage;
  model.state.search.page = 1;
  model.state.search.pageAuthenticationLogs = 1;

  try {
    tableView.renderTableSpinner();

    getFunction(logs.page, logs.rowsPerPage);

    const query = searchView.query();
    if (query) return controlSearchResults(targetView);

    controlRenderAllLogs(targetView);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

const controlPages = async function (page, targetView) {
  const { logs, tableView, getFunction } = controlView(targetView);
  if (isNaN(page)) return;

  try {
    tableView.renderTableSpinner();

    await getFunction(page, logs.rowsPerPage);

    if (targetView instanceof ActivityLogSearchView)
      model.state.search.page = page;
    else model.state.search.pageAuthenticationLogs = page;

    controlRenderAllLogs(targetView);
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

    // Initialize list of users
    activityLogTableView.users = model.state.users;
    authenticationLogTableView.users = model.state.users;

    model.state.search.pageAuthenticationLogs = 1;

    // Initialize table & rows per page
    model.state.rowsPerPage = 50; // paginationView.rowsPerPage();
    model.state.rowsPerPageAuthenticationLogs = 50;
    activityLogTableView.renderAll(model.state.activityLogs);
    authenticationLogTableView.renderAll(model.state.authenticationLogs);
    // controlRenderAllLogs();

    // Search view handler
    activityLogSearchView.addHandlerSearch(controlSearchResults);
    activityLogSearchView.addHandlerClearSearch(controlClearSearchResults);
    authenticationLogSearchView.addHandlerSearch(controlSearchResults);
    authenticationLogSearchView.addHandlerClearSearch(
      controlClearSearchResults
    );

    // Pagination view handlers
    activityLogPaginationView.addHandlerOnChangeRowsPerPage(controlRowsPerPage);
    activityLogPaginationView.addHandlerClickPage(controlPages);
    authenticationLogPaginationView.addHandlerOnChangeRowsPerPage(
      controlRowsPerPage
    );
    authenticationLogPaginationView.addHandlerClickPage(controlPages);

    console.log(model.state);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

init();

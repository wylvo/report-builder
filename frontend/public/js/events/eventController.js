import * as model from "./eventModel.js";

import activityLogTableView, {
  ActivityLogTableView,
} from "./views/activityLogTableView.js";

import activityLogPaginationView, {
  ActivityLogPaginationView,
} from "./views/activityLogPaginationView.js";

import activityLogSearchView, {
  ActivityLogSearchView,
} from "./views/activityLogSearchView.js";

import authenticationLogTableView, {
  AuthenticationLogTableView,
} from "./views/authenticationLogTableView.js";

import authenticationLogPaginationView, {
  AuthenticationLogPaginationView,
} from "./views/authenticationLogPaginationView.js";

import authenticationLogSearchView, {
  AuthenticationLogSearchView,
} from "./views/authenticationLogSearchView.js";

import notificationsView from "../_views/notificationsView.js";

const controlView = function (targetView) {
  if (
    targetView instanceof ActivityLogTableView ||
    targetView instanceof ActivityLogPaginationView ||
    targetView instanceof ActivityLogSearchView
  ) {
    return {
      logs: {
        array: model.state.activityLogs,
        total: model.state.activityLogsTotal,
        rowsPerPage: model.state.rowsPerPage,
        page: model.state.search.page,
      },
      tableView: activityLogTableView,
      searchView: activityLogSearchView,
      paginationView: activityLogPaginationView,
    };
  } else if (
    targetView instanceof AuthenticationLogTableView ||
    targetView instanceof AuthenticationLogPaginationView ||
    targetView instanceof AuthenticationLogSearchView
  ) {
    return {
      logs: {
        array: model.state.authenticationLogs,
        total: model.state.authenticationLogsTotal,
        rowsPerPage: model.state.rowsPerPageAuthenticationLogs,
        page: model.state.search.pageAuthenticationLogs,
      },
      tableView: authenticationLogTableView,
      searchView: authenticationLogSearchView,
      paginationView: authenticationLogPaginationView,
    };
  }
};

const controlSearchResults = function (targetView) {
  const { logs, tableView, searchView } = controlView(targetView);
  if (model.state.search.results) model.state.search.results = [];

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
  console.log(logs);

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
  const { tableView, searchView } = controlView(targetView);

  model.state.rowsPerPage = rowsPerPage;
  model.state.rowsPerPageAuthenticationLogs = rowsPerPage;
  model.state.search.page = 1;
  model.state.search.pageAuthenticationLogs = 1;

  try {
    tableView.renderTableSpinner();

    targetView instanceof ActivityLogPaginationView
      ? await model.DB.getActivityLogs(
          model.state.search.page,
          model.state.rowsPerPage
        )
      : await model.DB.getAuthenticationLogs(
          model.state.search.pageAuthenticationLogs,
          model.state.rowsPerPageAuthenticationLogs
        );

    const query = searchView.query();
    if (query) return controlSearchResults(targetView);

    controlRenderAllLogs(targetView);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

const controlPages = async function (page, targetView) {
  const { tableView } = controlView(targetView);
  if (isNaN(page)) return;

  try {
    tableView.renderTableSpinner();

    if (targetView instanceof ActivityLogPaginationView) {
      await model.DB.getActivityLogs(page, model.state.rowsPerPage);
      model.state.search.page = page;
    }

    if (targetView instanceof AuthenticationLogPaginationView) {
      await model.DB.getAuthenticationLogs(
        page,
        model.state.rowsPerPageAuthenticationLogs
      );
      model.state.search.pageAuthenticationLogs = page;
    }

    controlRenderAllLogs(targetView);
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

/*
 *********************************************************
 * INITIALIZE ALL HANDLERS, AND RENDER ALL EXISTING LOGS *
 *********************************************************
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

    controlRenderAllLogs(activityLogTableView);
    controlRenderAllLogs(authenticationLogTableView);

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

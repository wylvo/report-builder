import * as model from "./accountModel.js";

import { MultiselectDropdown } from "../multiselect-dropdown.js";

import searchView from "../_views/searchView.js";
import paginationView from "../_views/paginationView.js";
import activityLogTableView from "./views/activityLogTableView.js";
import authenticationLogTableView from "./views/authenticationLogTableView.js";

import reportTableView from "../reports/views/reportTableView.js";
import notificationsView from "../_views/notificationsView.js";

const controlSearchResults = function (logs) {
  model.state.search.page = 1;

  const query = searchView.query();
  if (!query) return controlClearSearchResults();

  const filterBy = searchView.filterBy();
  model.filterSearch(logs, query, filterBy);

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
      ? await model.DB.getAllSoftDeletedReportsCreatedByUser(
          model.state.search.pageDeletedView,
          model.state.rowsPerPage
        )
      : await model.DB.getAllReportsCreatedByUser(
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
      await model.DB.getAllSoftDeletedReportsCreatedByUser(
        page,
        model.state.rowsPerPage
      );
      model.state.search.pageDeletedView = page;
    }

    if (!reportTableView.isDeletedViewActive) {
      await model.DB.getAllReportsCreatedByUser(page, model.state.rowsPerPage);
      model.state.search.page = page;
    }

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
    model.state.activityLogs = model.state.user.activityLogs || [];
    model.state.activityLogsTotal = model.state.user.activityLogsTotal || 0;
    model.state.authenticationLogs = model.state.user.authenticationLogs || [];
    model.state.authenticationLogsTotal =
      model.state.user.authenticationLogsTotal || 0;
    // model.state.search.pageDeletedView = 1;

    // Initialize list of users
    activityLogTableView.users = model.state.usersFrontend;

    // Initialize table & rows per page
    model.state.rowsPerPage = paginationView.rowsPerPage();
    controlRenderAllReports();

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

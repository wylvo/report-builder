import {
  state,
  pages,
  rowsPerPage,
  filterSearch,
  initThemeInLocalStorage,
} from "../model.js";
import api from "../api.js";

import * as userModel from "../users/userModel.js";
import * as accountModel from "../account/accountModel.js";

// 1st function to be ran by ./accountController.js
const init = async function () {
  const page = state.search.page;
  const rowsPerPage = state.rowsPerPage;

  await userModel.DB.getUsers();

  await Promise.all([
    accountModel.DB.getCurrentUserAccount(),
    DB.getActivityLogs(page, rowsPerPage),
    DB.getAuthenticationLogs(page, rowsPerPage),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

// API requests linked to the backend database
const DB = {
  getActivityLogs: async (page, rowsPerPage) => {
    // API request to get all activity logs from the database
    const {
      data: { data, total },
    } = await api.v1.activityLog.getActivityLogs(page, rowsPerPage);

    // Add all activity logs in the model state
    state.activityLogs = data;
    state.activityLogsTotal = total;

    return data;
  },
  getAuthenticationLogs: async (page, rowsPerPage) => {
    // API request to get all authentication logs from the database
    const {
      data: { data, total },
    } = await api.v1.authenticationLog.getAuthenticationLogs(page, rowsPerPage);

    // Add all authentication logs in the model state
    state.authenticationLogs = data;
    state.authenticationLogsTotal = total;

    return data;
  },
  getCurrentUserAccount: async () => {
    // API request to get the current signed in user account from the database
    const {
      data: { data: user },
    } = await api.v1.users.getCurrentUserAccount();

    state.user = user;

    return user;
  },
};

export {
  // from -> ../model.js
  state,
  pages,
  rowsPerPage,
  filterSearch,

  // from this local file -> ./eventModel.js
  DB,
  init,
};

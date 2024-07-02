import {
  state,
  initNumberOfTabs,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  initThemeInLocalStorage,
} from "../model.js";
import api from "../api.js";

import * as reportModel from "../reports/reportModel.js";

// 1st function to be ran by ./accountController.js
const init = async function () {
  await DB.getCurrentUserAccount();
  await Promise.all([
    reportModel.DB.getAllReportsCreatedByUser(),
    reportModel.DB.getAllSoftDeletedReportsCreatedByUser(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

// API requests linked to the backend database
const DB = {
  softDeleteReport: async (id) => reportModel.DB.softDeleteReport(id),
  hardDeleteReport: async (id, password) =>
    reportModel.DB.hardDeleteReport(id, password),
  undoSoftDeleteReport: async (id) => reportModel.DB.undoSoftDeleteReport(id),
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
  initNumberOfTabs,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,

  // from this local file -> ./accountModel.js
  DB,
  init,
};

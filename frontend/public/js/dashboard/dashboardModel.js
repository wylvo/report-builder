import { state, initThemeInLocalStorage } from "../model.js";
import api from "../api.js";
import utils from "../utils.js";

import * as accountModel from "../account/accountModel.js";
import * as userModel from "../users/userModel.js";

// 1st function to be ran by ./dashboardController.js
const init = async () => {
  await Promise.all([
    DB.getStats(),
    accountModel.DB.getCurrentUserAccount(),
    userModel.DB.getUsersFrontend(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

const DB = {
  getStats: async () => {
    const { data } = await api.v1.stats.getStats();

    state.stats = data.data;

    return data;
  },
};

export {
  // from -> ../model.js
  state,

  // from this local file -> ./ddashboardModel.js
  DB,
  init,
};

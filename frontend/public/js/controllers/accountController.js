import * as model from "../model/model.js";
import accountTabsView from "../views/account/accountTabsView.js";

import reportTableView from "../views/reports/reportTableView.js";
import searchView from "../views/searchView.js";
import paginationView from "../views/paginationView.js";

import notificationView from "../views/notifications/notificationView.js";
import modalView from "../views/notifications/modalView.js";

let accountFormView,
  takeSnapshot = false;

export const init = async function () {
  await model.init();

  // Initialize all tabs
  accountTabsView.renderAll(model.initNumberOfTabs(1));
  accountFormView = accountTabsView.tabs.get(model.state.tab);
  accountFormView.render(model.state.user.account);
};

init();

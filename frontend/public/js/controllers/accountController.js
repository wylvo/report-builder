import * as model from "../model/model.js";
import accountTabsView from "../views/account/accountTabsView.js";

import reportTableView from "../views/reports/reportTableView.js";
import searchView from "../views/searchView.js";
import paginationView from "../views/paginationView.js";

import notificationView from "../views/notifications/notificationView.js";
import modalView from "../views/notifications/modalView.js";

let userFormView,
  takeSnapshot = false;

// prettier-ignore
const controlUniqueUserPerTab = function (id, event = undefined) {
  for (const [index, tab] of model.state.tabs) {
    if (tab.data.id && tab.data.id === id) {
      const userFormView = accountTabsView.tabs.get(index);
      if (!event) userFormView._tab.firstElementChild.click();
      return true;
    }
  }
  if (event) {
    controlTabs(model.state.tab, id);
    controlRenderUser();
  }
  return false;
};

export const init = async function () {
  await model.init();

  // Initialize all tabs
  accountTabsView.renderAll(model.initNumberOfTabs(1));
};

init();

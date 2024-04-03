import sidebarView from "../views/sidebar/sidebarView.js";
import * as model from "../model/model.js";
import * as reportController from "./reportController.js";
import * as userController from "./userController.js";

const controlSidebarMenus = async (linkName) => {
  if (linkName === "dashboard") "";
  if (linkName === "reports") await reportController.init();
  if (linkName === "users") await userController.init();
};

// sidebarView.addHandlerClickSidebarMenus(controlSidebarMenus);

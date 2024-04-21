import * as model from "../model/model.js";
import sidebarView from "./views/sidebarView.js";
import themeView from "../_views/themeView.js";

const controlTheme = function (theme) {
  if (!theme) return;
  try {
    themeView.setTheme(model.switchTheme(theme));
    model.saveThemeInLocalStorage();
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

// Theme view handler
themeView.addHandlerSwitchTheme(controlTheme);
themeView.setTheme(model.state.theme);

// sidebarView.addHandlerClickSidebarMenus();

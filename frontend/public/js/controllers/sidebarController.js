import * as model from "../model/model.js";
import sidebarView from "../views/sidebar/sidebarView.js";
import themeView from "../views/theme/themeView.js";

const controlTheme = function (theme) {
  if (!theme) return;
  try {
    themeView.setTheme(model.switchTheme(theme));
    model.saveThemeInLocalStorage();
  } catch (error) {
    console.error(error);
    notificationView.error(error.message);
  }
};

// Theme view handler
themeView.addHandlerSwitchTheme(controlTheme);
themeView.setTheme(model.state.theme);

// sidebarView.addHandlerClickSidebarMenus();

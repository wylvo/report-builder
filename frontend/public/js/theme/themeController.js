import * as model from "../model.js";
import themeView from "./views/themeView.js";

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

class ThemeView {
  #rootElement = document.documentElement;
  #themeButton = document.querySelector("#theme");

  addHandlerSwitchTheme(handler) {
    this.#themeButton.addEventListener("click", () => {
      const theme = this.#rootElement.getAttribute("data-theme");
      handler(theme);
    });
  }

  // prettier-ignore
  setTheme(theme) {
    this.#rootElement.setAttribute("data-theme", theme);
    this.#themeButton
      .firstElementChild
      .firstElementChild
      .setAttribute("href", `/img/icons.svg#icon-${theme}-theme`);
  }
}

export default new ThemeView();

class ThemeView {
  #rootElement = document.documentElement;
  #btnTheme = document.querySelector("#theme");

  addHandlerSwitchTheme(handler) {
    this.#btnTheme.addEventListener("click", () => {
      const theme = this.#rootElement.getAttribute("data-theme");
      handler(theme);
    });
  }

  // prettier-ignore
  setTheme(theme) {
    this.#rootElement.setAttribute("data-theme", theme);
    this.#btnTheme
      .firstElementChild
      .firstElementChild
      .setAttribute("href", `/img/icons.svg#icon-${theme}-theme`);
  }
}

export default new ThemeView();

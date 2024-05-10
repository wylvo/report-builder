import View from "./View.js";

export default class TabsView extends View {
  #container = document.querySelector(".tab-form-ctn");
  #tabsContainer = document.querySelector(".tabs-ctn");

  #tabsList = document.querySelector(".tab-list");
  #tabButtons;

  #tabFormContainer = document.querySelector(".tabs-forms");
  #tabForms;

  constructor(targetView) {
    super();
    this.tabs = new Map();
    this.targetView = targetView;
  }

  #clearTabs() {
    this.#tabsList.innerHTML = "";
    this.#tabFormContainer.innerHTML = "";
  }

  generateTabElement(index) {
    return this.htmlStringToElement(this._generateTabHtml(index));
  }

  generateFormElement(formData, index) {
    return this.htmlStringToElement(this._generateFormHtml(formData, index));
  }

  renderAll(formData, numberOfTabs = [0, 1, 2, 3, 4]) {
    this.#clearTabs();
    const tabsList = document.querySelector(".tab-list");
    const tabFormContainer = document.querySelector(".tabs-forms");

    Object.keys(formData.selects).forEach((key) => {
      formData.selects[key] = formData.selects[key].map(
        (selectValue) =>
          `<option value="${selectValue.escapeHTML()}">${selectValue.escapeHTML()}</option>`
      );
    });

    this.tabs = new Map(
      numberOfTabs.map((_, tabIndex) => {
        const tabElement = this.generateTabElement(tabIndex);
        const formElement = this.generateFormElement(formData, tabIndex);

        tabsList.appendChild(tabElement);
        tabFormContainer.appendChild(formElement);

        const currentView = new this.targetView(tabElement, formElement);
        return [tabIndex, currentView];
      })
    );

    this.#init();
    return this.tabs;
  }

  render(tabIndex, title, id) {
    const currentView = this.tabs.get(tabIndex);
    currentView._tab.firstElementChild.textContent = title;
    currentView._tab.firstElementChild.setAttribute("href", `#${id}`);
  }

  renderFormData(data) {}

  // prettier-ignore
  moveLeft(currentTab) {
    if (!currentTab.parentElement.previousElementSibling)
      return this.switchTab(this.#tabButtons[this.#tabButtons.length - 1]);
    else
      return this.switchTab(currentTab.parentElement.previousElementSibling.querySelector(".tab-btn"));
  }

  // prettier-ignore
  moveRight(currentTab) {
    if (!currentTab.parentElement.nextElementSibling)
      return this.switchTab(this.#tabButtons[0]);
    else
      return this.switchTab(currentTab.parentElement.nextElementSibling.querySelector(".tab-btn"));
  }

  switchTab(newTab) {
    const tabIndex = Number(newTab.getAttribute("id").split("_")[1]);
    if (isNaN(tabIndex)) return;

    const currentView = this.tabs.get(tabIndex);
    const activeForm = currentView._form;

    this.#tabForms.forEach((form) => form.setAttribute("hidden", ""));
    activeForm.removeAttribute("hidden");
    currentView._expandAllAccordions();

    this.#tabButtons.forEach((button) => {
      button.setAttribute("aria-selected", false);
      button.setAttribute("tabindex", "-1");
    });

    newTab.setAttribute("aria-selected", true);
    newTab.setAttribute("tabindex", "0");
    newTab.focus();

    return tabIndex;
  }

  #init() {
    this.#tabButtons = document.querySelectorAll(".tab-btn");
    this.#tabForms = document.querySelectorAll(".tabs-forms > form");
  }

  addHandlerClickTab(handler) {
    this.#tabsContainer.addEventListener("click", (e) => {
      const clickedTab = e.target.closest(".tab-btn");
      if (!clickedTab) return;
      e.preventDefault();
      const tabIndex = this.switchTab(clickedTab);
      handler(tabIndex);
    });
  }

  // prettier-ignore
  addHandlerKeydown(handler) {
    this.#tabsContainer.addEventListener("keydown", (e) => {
      let tabIndex;
      switch (e.key) {
        case "ArrowLeft":
          tabIndex = this.moveLeft(document.activeElement);
          handler(tabIndex);
          break;

        case "ArrowRight":
          tabIndex = this.moveRight(document.activeElement);
          handler(tabIndex);
          break;

        case "Home":
          e.preventDefault();
          tabIndex = this.switchTab(this.#tabButtons[0]);
          handler(tabIndex);
          break;

        case "End":
          e.preventDefault();
          tabIndex = this.switchTab(this.#tabButtons[this.#tabButtons.length - 1]);
          handler(tabIndex);
          break;
      }
    });
  }
}

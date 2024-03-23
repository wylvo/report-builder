export default class View {
  _appVersion = document.querySelector("#app-version");
  _clipboard;

  // https://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery#answer-13510502
  escapeHTML = (String.prototype.escapeHTML = function () {
    const __entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    };

    return String(this).replace(/[&<>"'`=\/]/g, (s) => {
      return __entityMap[s];
    });
  });

  // Scroll Top/Bottom Buttons
  #scrollTop = document.querySelector(".scroll-top-btn");
  #scrollBottom = document.querySelector(".scroll-bottom-btn");

  constructor() {
    this.#addHandlerScrollToTop();
    this.#addHandlerScrollTo();
  }

  // Convert HTML string to DOM element
  htmlStringToElement(htmlString) {
    const template = document.createElement("template");
    template.insertAdjacentHTML("beforeend", htmlString.trim());
    return template.lastElementChild;
  }

  _escapeHtml(report) {
    report.tableRowEl = {};
    const clone = structuredClone(report);
    this.#traverse(clone, this.#escapeHtmlObjectKeyValueTypeOfString);

    clone.tableRowEl = this.htmlStringToElement(this._generatetHtml(clone));
    report.tableRowEl = clone.tableRowEl;
    return clone.tableRowEl;
  }

  #escapeHtmlObjectKeyValueTypeOfString(object, key) {
    if (typeof object[key] === "string") object[key] = object[key].escapeHTML();
  }

  // https://stackoverflow.com/questions/722668/traverse-all-the-nodes-of-a-json-object-tree-with-javascript#answer-722732
  #traverse(object, func) {
    for (const key in object) {
      func.apply(this, [object, key]);
      //going one step down in the object tree!!
      if (Object.hasOwn(object, key) && typeof object[key] === "object")
        this.#traverse(object[key], func);
    }
  }

  // Check if object is empty
  isEmptyObject(object) {
    for (const property in object) {
      if (Object.hasOwn(object, property)) {
        return false;
      }
    }
    return true;
  }

  // Sleep/Wait and do nothing
  sleep(seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  updateLocationHash(id = undefined) {
    history.replaceState(null, null, `#${id ? id : ""}`);
  }

  // prettier-ignore
  removeLocationHash() {
    if(window.location.hash) history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  // prettier-ignore
  renderSpinner(targetEl, childrenIndex = undefined) {
    const spinnerHtml = `
      <div class="icons icon-spinner">
        <svg>
          <g class="spinner">
            <use href="/img/icons.svg#icon-loader"></use>
          </g>
        </svg>
      </div>
    `;
    if(childrenIndex) targetEl.children[childrenIndex].replaceWith(this.htmlStringToElement(spinnerHtml));
    else targetEl.firstElementChild.replaceWith(this.htmlStringToElement(spinnerHtml));
  }

  // prettier-ignore
  clearSpinner(targetEl, status, childrenIndex = undefined) {
    const replacementHtml = `
      <svg class="icons">
        <use href="/img/icons.svg#icon-ms-teams"></use>
      </svg>
    `
    if (childrenIndex) targetEl.children[childrenIndex].replaceWith(this.htmlStringToElement(replacementHtml));
    else targetEl.firstElementChild.replaceWith(this.htmlStringToElement(replacementHtml));
    
    if (status === "error" || status === "success")
      if(targetEl.querySelector(`.status-${status}`))
        targetEl.querySelector(`.status-${status}`).replaceWith(this.htmlStringToElement(this.statusHtml(status)));
      else
        targetEl.appendChild(this.htmlStringToElement(this.statusHtml(status)));
  }

  statusHtml(status) {
    status = status.escapeHTML();
    return `
      <svg class="icons status-${status}">
        <use href="/img/icons.svg#icon-${status}"></use>
      </svg>
    `;
  }

  scrollToTop() {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }

  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }

  // Scroll To Bottom Of The Page
  #addHandlerScrollToTop() {
    // this.#scrollTop.addEventListener("click", this.scrollToTop.bind(this));
  }

  // prettier-ignore
  // Scroll To Top Of The Page
  #addHandlerScrollTo() {
    // this.#scrollBottom.addEventListener("click", this.scrollToBottom.bind(this));
  }
}

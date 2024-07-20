export default class View {
  _appVersion = document.querySelector("#app-version");
  users;

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

  constructor() {}

  // Convert HTML string to DOM element
  htmlStringToElement(htmlString) {
    const template = document.createElement("template");
    template.insertAdjacentHTML("beforeend", htmlString.trim());
    return template.lastElementChild;
  }

  _escapeHtml(data) {
    const currentElement = data.tableRowEl;
    data.tableRowEl = {};

    const clone = structuredClone(data);

    this.#traverse(clone, this.#escapeHtmlObjectKeyValueTypeOfString);

    clone.tableRowEl = this.htmlStringToElement(this._generatetHtml(clone));
    data.tableRowEl = clone.tableRowEl;
    return { currentElement, newElement: clone.tableRowEl };
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
  clearSpinner(targetEl, status, icon, childrenIndex = undefined) {
    const replacementHtml = {
      save: `<svg class="icons"><use href="/img/icons.svg#icon-save"></use></svg>`,
      update: `<svg class="icons"><use href="/img/icons.svg#icon-sync"></use></svg>`,
      delete: `<svg class="icons"><use href="/img/icons.svg#icon-delete"></use></svg>`,
      undo: `<svg class="icons"><use href="/img/icons.svg#icon-undo"></use></svg>`,
      teams: `<svg class="icons"><use href="/img/icons.svg#icon-ms-teams"></use></svg>`,
      password: `<svg class="icons"><use href="/img/icons.svg#icon-key"></use></svg>`,
      active: `<svg><use href="/img/icons.svg#icon-enable"></use></svg>`,
      inactive: `<svg><use href="/img/icons.svg#icon-disable"></use></svg>`,
      hardDelete: `<p>Hard Delete Report</p>`,
      import: `<p>Import Reports</p>`,
      table: ``
    };

    if (childrenIndex) targetEl.children[childrenIndex].replaceWith(this.htmlStringToElement(replacementHtml[icon]));
    else targetEl.firstElementChild.replaceWith(this.htmlStringToElement(replacementHtml[icon]));
    
    if (status === "error" || status === "success" || status ===  "warning")
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

  timeAgo(date) {
    // Get the current date and time
    const now = new Date();

    // Parse the input date and time
    const past = new Date(date);

    // Calculate the difference in seconds between the current date and the input date
    const diffInSeconds = Math.floor((now - past) / 1000);

    // If the difference is less than 30 seconds, return 'Just now'
    if (diffInSeconds < 30) {
      return "Just now";
    }

    // Define the time units and their corresponding number of seconds
    const units = [
      { name: "year", seconds: 31536000 },
      { name: "month", seconds: 2592000 },
      { name: "week", seconds: 604800 },
      { name: "day", seconds: 86400 },
      { name: "hour", seconds: 3600 },
      { name: "minute", seconds: 60 },
      { name: "second", seconds: 1 },
    ];

    // Loop through the units and find the largest applicable unit
    for (let unit of units) {
      const interval = Math.floor(diffInSeconds / unit.seconds);

      // If the interval is 1 or more, return the formatted string
      if (interval >= 1) {
        return `${interval} ${unit.name}${interval > 1 ? "s" : ""} ago`;
      }
    }

    // If no other condition matches, return 'Just now' (This line should not be reached)
    return "Just now";
  }
}

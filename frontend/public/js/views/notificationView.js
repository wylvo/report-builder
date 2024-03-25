import View from "./View.js";

export class NotificationView extends View {
  #ERROR = "error";
  #WARNING = "warning";
  #SUCCESS = "success";
  #DELETE = "delete";
  #SAVE = "save";
  #INFO = "info";

  #notificationContainer = document.querySelector(".notifications");
  _notificationElement;

  _headerText;
  _contentText;

  constructor(timeout) {
    super();
    this.timeout = timeout || 10;
  }

  // prettier-ignore
  render(type, icon, timeoutSec = this.timeout, header, content) {
    type = type.escapeHTML();
    icon = icon.escapeHTML();
    header = header.escapeHTML();
    content = content.escapeHTML();

    const notificationHtml = `
      <div class="notification ${type}">
        <div class="notification-content">
          <svg class="icons">
            <use href="/img/icons.svg#icon-${icon}"></use>
          </svg>
          <div class="message">
            <span class="header">${header}</span>
            <span >${content}</span>
          </div>
        </div>
        <button class="close-btn">&times;</button>
        <div class="progress"></div>
      </div>
    `;
    this._notificationElement = this.htmlStringToElement(notificationHtml);
    this._notificationElement.style.setProperty("--timeout", `${timeoutSec}s`);
    this.#notificationContainer.appendChild(this._notificationElement);
    return this.clear(this._notificationElement, timeoutSec);
  }

  clear(element, timeoutSec) {
    if (timeoutSec <= 0) {
      return element.remove();
    }
    const timeout = setTimeout(() => {
      element.remove();
    }, timeoutSec * 1000);

    element.querySelector(".close-btn")?.addEventListener("click", () => {
      clearTimeout(timeout);
      element.remove();
    });
  }

  // prettier-ignore
  error(message, timeoutSec) {
    return this.render(this.#ERROR, this.#ERROR, timeoutSec, this.#ERROR, message);
  }

  // prettier-ignore
  delete(message, timeoutSec) {
    if(message === null || message.includes("Failed"))
      return this.render(this.#ERROR, this.#DELETE, timeoutSec, this.#DELETE, message);
    return this.render(this.#SUCCESS, this.#DELETE, timeoutSec, this.#DELETE, message);
  }

  // prettier-ignore
  warning(message, timeoutSec) {
    return this.render(this.#WARNING, this.#WARNING, timeoutSec, this.#WARNING, message);
  }

  // prettier-ignore
  success(message, timeoutSec) {
    return this.render(this.#SUCCESS, this.#SUCCESS, timeoutSec, this.#SUCCESS, message);
  }

  // prettier-ignore
  save(message, timeoutSec) {
    return this.render(this.#INFO, this.#SAVE, timeoutSec, this.#INFO, message);
  }

  // prettier-ignore
  info(message, timeoutSec) {
    return this.render(this.#INFO, this.#INFO, timeoutSec, this.#INFO, message);
  }
}

export default new NotificationView();

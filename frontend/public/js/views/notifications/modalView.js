import { ModalFormView } from "../modal/modalFormView.js";
import { NotificationView } from "./notificationView.js";

class ModalView extends NotificationView {
  #modalContainer = document.querySelector(".modal-ctn");
  #overlay = document.querySelector(".overlay");
  #timeout;

  _modalElement;
  _overlayElement;

  #btnConfirmText;
  #btnConfirmAltText;
  #btnCancelText;
  #isTrusted = false;

  render(type, icon, timeoutSeconds, headerText, contentText) {
    if (this.#modalContainer.firstChild) return;
    type = type.escapeHTML();
    icon = icon.escapeHTML();
    headerText = this._headerText.escapeHTML();

    if (!this.#isTrusted) contentText = this._contentText.escapeHTML();
    else contentText = this._contentText;
    this.#btnConfirmText = this.#btnConfirmText.escapeHTML();
    this.#btnCancelText = this.#btnCancelText.escapeHTML();

    // prettier-ignore
    const modalHtml = `
      <div class="modal">
        <button class="modal-close-btn">&times;</button>
        <div class="modal-header">
          <svg class="modal-icon ${type}">
            <use href="/img/icons.svg#icon-${icon}"></use>
          </svg>
          <h1 class="modal-header-text">${headerText}</h1>
        </div>
        <div class="modal-content">
          <div class="modal-content-text">
            <span>${contentText}</span>
          </div>
          <div class="modal-btns">
            <button class="modal-btn-confirm ${type}">${this.#btnConfirmText}</button>
            ${
              this.#btnConfirmAltText
                ? `<button class="modal-btn-confirm-hard ${type}">${this.#btnConfirmAltText}</button>`
                : ""
            }
            <button class="modal-btn-cancel">${this.#btnCancelText}</button>
          </div>
        </div>
      </div>
    `;

    this._modalElement = this.htmlStringToElement(modalHtml);
    this.#modalContainer.appendChild(this._modalElement);
    this._modalElement.querySelector(".modal-btn-cancel").focus();
    this.#overlay.classList.remove("hidden");
    return this.#resolvePromise(timeoutSeconds);
  }

  #resolvePromise(timeoutSeconds) {
    return new Promise((resolve) => {
      this.addHandlerCloseModal(
        [this._modalElement, this.#overlay],
        this.clear.bind(this, resolve, this.#timeout)
      );
      this.addHandlerEscapeModal(
        this._modalElement,
        this.clear.bind(this, resolve, this.#timeout)
      );

      // this.#timeout = setTimeout(() => {
      //   this.closeModal(this.#timeout);
      //   resolve(false);
      // }, timeoutSeconds * 1000);
      // clearTimeout(this.#timeout);
    });
  }

  closeModal(timeout) {
    clearTimeout(timeout);
    this.#modalContainer.innerHTML = "";
    this.#overlay.classList.add("hidden");
    this.#timeout = undefined;
    this._modalElement = undefined;
  }

  // prettier-ignore
  clear (resolve, timeout, e) {
    if (e.type === "keydown" && e.key === "Escape") {
      this.closeModal(timeout);
      resolve(false);
    }
    if (e.type === "click" && e.target) {
      if (e.target.closest(".modal-close-btn") || e.target.closest(".modal-btn-cancel") || e.target.closest(".overlay")) {
        this.closeModal(timeout);
        resolve(false);
      }
      if (e.target.closest(".modal-btn-confirm")) {
        this.closeModal(timeout);
        resolve(true);
      }
      if (e.target.closest(".modal-btn-confirm-hard")) {
        const modalFormView = new ModalFormView();
        this._modalElement.replaceWith(modalFormView._form);

        this.addHandlerCloseModal([modalFormView._form], this.clear.bind(this, resolve, this.#timeout));
        this.addHandlerEscapeModal(modalFormView._form, this.clear.bind(this, resolve, this.#timeout));
        
        resolve(modalFormView);
      }
    }
  }

  // prettier-ignore
  confirmDelete (data, timeoutSeconds = 30) {
    this.#isTrusted = true;

    let dataFill
    if(data?.incident?.title) 
      dataFill = { content: data.incident.title, id: data.id, type: "report"}
    else if(data?.email)
      dataFill = { content: data.email, id: data.id, type: "user"}
    else return;

    this._headerText = "Are you sure?";
    this._contentText = `
      <p>Do you really want to delete the following ${dataFill.type}?</p><br>
      <p><strong>${dataFill.content.escapeHTML()}</strong><br>
      ${dataFill.id.escapeHTML()}</p>
    `;
    this.#btnConfirmText = "Yes, Delete";
    this.#btnCancelText = "No, Cancel";
    return this.delete(null, timeoutSeconds);
  }

  // prettier-ignore
  confirmDeleteOrHardDelete (report, timeoutSeconds = 30) {
    this.#isTrusted = true;

    this._headerText = "Are you sure?";
    this._contentText = `
      <p>Do you really want to delete the following report?</p><br>
      <p><strong>${report.incident.title.escapeHTML()}</strong><br>
      ${report.id.escapeHTML()}</p>
    `;
    this.#btnConfirmText = "Yes, Delete";
    this.#btnConfirmAltText = "Yes, HARD Delete";
    this.#btnCancelText = "No, Cancel";
    return this.delete(null, timeoutSeconds);
  }

  // prettier-ignore
  confirmUndo (data, timeoutSeconds = 30) {
    this.#isTrusted = true;

    let dataFill
    if(data?.incident?.title) 
      dataFill = { content: data.incident.title, id: data.id }
    else return;

    this._headerText = "Are you sure?";
    this._contentText = `
      <p>Recover the following report?</p><br>
      <p><strong>${dataFill.content.escapeHTML()}</strong><br>
      ${dataFill.id.escapeHTML()}</p>
    `;
    this.#btnConfirmText = "Yes, Undo Delete";
    this.#btnCancelText = "No, Cancel";
    return this.undo(null, timeoutSeconds);
  }

  confirmSave(timeoutSeconds = 3) {
    this.#isTrusted = true;
    this._headerText = "You have unsaved changes";
    this._contentText =
      "Please save your changes before switching tabs or before rendering data. Save changes?";
    this.#btnConfirmText = "Save Changes";
    this.#btnCancelText = "Discard Changes";
    return this.save(null, timeoutSeconds);
  }

  // prettier-ignore
  confirmSend (timeoutSeconds = 30) {
    this.#isTrusted = true;
    this._headerText = "Teams Channel button already triggered";
    this._contentText = `
      <p>To prevent report duplicates, it is strongly advised 
      to make & save all changes before you are ready to 
      send to the Teams Channel.</p><br>
      <p>If you still do not see your report, select "<strong>Send Anyways</strong>".</p>
    `;
    this.#btnConfirmText = "Send Anyways";
    this.#btnCancelText = "No, Cancel";
    return this.info(null, timeoutSeconds);
  }

  confirmImport;

  // prettier-ignore
  confirmCustom(type, headerText, contentText, btnConfirmText, btnCancelText, timeoutSeconds = 120) {
    this.#isTrusted = false;
    this._headerText = headerText;
    this._contentText = contentText;
    this.#btnConfirmText = btnConfirmText;
    this.#btnCancelText = btnCancelText;
    if (type === "error") return this.error(null, timeoutSeconds);
    if (type === "warning") return this.warning(null, timeoutSeconds);
    if (type === "success") return this.success(null, timeoutSeconds);
    if (type === "info") return this.info(null, timeoutSeconds);
    throw new TypeError("Invalid modal type. Choose between: ['error', 'warning' , 'success', 'info']");
  }

  addHandlerCloseModal(elements = [], handler) {
    elements.forEach((element) => {
      element.addEventListener("click", handler);
    });
  }

  addHandlerEscapeModal(element, handler) {
    element.addEventListener("keydown", handler);
  }
}

export default new ModalView();

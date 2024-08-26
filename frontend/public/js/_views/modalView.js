import { NotificationsView } from "./notificationsView.js";
import ModalFormView from "./modalFormView.js";

export default class ModalView extends NotificationsView {
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
            <button class="modal-btn confirm ${type}">${this.#btnConfirmText}</button>
            ${
              this.#btnConfirmAltText
                ? `<button class="modal-btn hard-delete ${type}">${this.#btnConfirmAltText}</button>`
                : ""
            }
            <button class="modal-btn cancel">${this.#btnCancelText}</button>
          </div>
        </div>
      </div>
    `;

    this._modalElement = this.htmlStringToElement(modalHtml);
    this.#modalContainer.appendChild(this._modalElement);
    this._modalElement.querySelector(".modal-btn.cancel").focus();
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
    });
  }

  closeModal(timeout) {
    if (timeout) clearTimeout(timeout);
    this.#modalContainer.innerHTML = "";
    this.#overlay.classList.add("hidden");
    this.#timeout = undefined;
    this.#btnConfirmAltText = undefined;
    this._modalElement = undefined;
  }

  // Close modal and resolve the promise
  clear(resolve, timeout, e) {
    const pressedOnEscapeKey = e.type === "keydown" && e.key === "Escape";

    // If pressed on escape key
    if (pressedOnEscapeKey) {
      this.closeModal(timeout);
      resolve(false);
    }

    if (e.type === "click" && e.target) {
      const clickedOnConfirm = e.target.closest(".confirm");
      const clickedOnHardDelete = e.target.closest(".hard-delete");
      const clickedOnCancelOrCloseOrOverlay =
        e.target.closest(".modal-close-btn") ||
        e.target.closest(".cancel") ||
        e.target.closest(".overlay");

      // If clicked on confirm button
      if (clickedOnConfirm) {
        this.closeModal(timeout);
        resolve(true);
      }

      // If clicked on close button, cancel button, or overlay
      if (clickedOnCancelOrCloseOrOverlay) {
        this.closeModal(timeout);
        resolve(false);
      }

      // If clicked on confirm hard delete button
      if (clickedOnHardDelete) {
        const modalFormView = new ModalFormView(this._modalElement);
        const newModalElement = modalFormView.hardDeleteForm();
        this._modalElement = newModalElement;

        this.addHandlerCloseModal(
          [newModalElement],
          this.clear.bind(this, resolve, this.#timeout)
        );
        this.addHandlerEscapeModal(
          newModalElement,
          this.clear.bind(this, resolve, this.#timeout)
        );

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
      ${String(dataFill.id).escapeHTML()}</p>
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
      ${String(report.id).escapeHTML()}</p>
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
      ${String(dataFill.id).escapeHTML()}</p>
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

  confirmImport() {
    if (this.#modalContainer.firstChild) return;
    this.#isTrusted = true;

    const modalFormView = new ModalFormView(this._modalElement);
    const newModalElement = modalFormView.importReportsForm();
    this._modalElement = newModalElement;

    if (!this.#modalContainer.firstChild)
      this.#modalContainer.appendChild(this._modalElement);

    this._modalElement.querySelector(".modal-btn.cancel").focus();
    this.#overlay.classList.remove("hidden");

    return this.#resolvePromise();
  }

  confirmTransferTo(users) {
    if (this.#modalContainer.firstChild) return;
    this.#isTrusted = true;

    const modalFormView = new ModalFormView(this._modalElement);
    const newModalElement = modalFormView.transferReportForm(users);
    this._modalElement = newModalElement;

    if (!this.#modalContainer.firstChild)
      this.#modalContainer.appendChild(this._modalElement);

    this._modalElement.querySelector(".modal-btn.cancel").focus();
    this.#overlay.classList.remove("hidden");

    return this.#resolvePromise();
  }

  // prettier-ignore
  confirmCustom(type, headerText, contentText, btnConfirmText, btnCancelText, timeoutSeconds = 120) {
    this.#isTrusted = false;
    this._headerText = headerText;
    this._contentText = contentText;
    this.#btnConfirmText = btnConfirmText;
    this.#btnCancelText = btnCancelText;
    if (type === "delete") return this.delete(null, timeoutSeconds);
    if (type === "error") return this.error(null, timeoutSeconds);
    if (type === "warning") return this.warning(null, timeoutSeconds);
    if (type === "import") return this.import(null, timeoutSeconds);
    if (type === "undo") return this.undo(null, timeoutSeconds);
    if (type === "success") return this.success(null, timeoutSeconds);
    if (type === "info") return this.info(null, timeoutSeconds);
    throw new TypeError(
      "Invalid modal type. Choose between: ['delete', 'error', 'warning', 'undo', 'success', 'info']"
    );
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

import ModalView from "../notifications/modalView.js";

export default class ModalFormView extends ModalView {
  constructor(modalElement) {
    super();
    this._modalElement = modalElement;
  }

  #btnImportReports = document.querySelector(".btn-import-reports");

  #modalForm = () => this._modalElement.querySelector("#form-modal");

  #btnHardDeleteReports = () =>
    this._modalElement.querySelector(".modal-btn-hard-delete");
  #password = () =>
    this._modalElement.querySelector(".hard-delete-password").value;
  #clearPassword() {
    const passwordField = this.#password();
    passwordField = "";
  }

  #reports = () => this._modalElement.querySelector(".import-reports");

  render(formHtml, headerText) {
    const modalFormHtml = `
      <div class="modal">
        <button class="modal-close-btn">&times;</button>
        <div class="modal-header">
          <h1 class="modal-header-text">${headerText.escapeHTML()}</h1>
        </div>
        ${formHtml}
      </div>
    `;

    const newModalElement = this.htmlStringToElement(modalFormHtml);
    this._modalElement.replaceWith(newModalElement);
    this._modalElement = newModalElement;
    this._modalElement
      .querySelector(".form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("SUBMITTED");
      });
    return newModalElement;
  }

  hardDeleteForm() {
    const headerText = "This operation is irreversible";
    const formHtml = `
      <form class="form" id="form-modal">
        <!-- HARD DELETE PASSWORD -->
        <div class="form-grouping-col mt-36">
          <input
            type="password"
            id="hard-delete-password"
            name="hard-delete-password"
            class="hard-delete-password"
            placeholder="Confirm With Password"
            required
          />
          <label for="hard-delete-password">Password:</label>
        </div>

        <!-- CALL TO ACTION BUTTON -->
        <div class="modal-btns">
          <button
            type="submit"
            id="modal-btn"
            class="modal-btn error"
          >
            Hard Delete Report
          </button>
          <button type="button" class="modal-btn cancel">No, Cancel</button>
        </div>
      </form>
    `;
    return this.render(formHtml, headerText);
  }

  importReportsForm() {
    const headerText = "Import Reports";
    const formHtml = `
      <form class="form" id="form-modal">
        <!-- REPORTS RAW JSON -->
        <div class="form-grouping-col mt-36">
          <textarea
            type="password"
            id="import-reports"
            name="import-reports"
            class="import-reports"
            placeholder="{ "id": "", "version": "", ... }"
            spellcheck="false"
            autocorrect="off"
            autocapitalize="off"
            wrap="off"
            required
          ></textarea>
          <label for="import-reports">Reports Raw JSON:</label>
        </div>

        <!-- CALL TO ACTION BUTTON -->
        <div class="modal-btns">
          <button
            type="submit"
            id="modal-btn-import"
            class="modal-btn-import success"
          >
            Import Reports
          </button>
          <button type="button" class="modal-btn-cancel">No, Cancel</button>
        </div>
      </form>
    `;
    return this.render(formHtml, headerText);
  }

  addHandlerConfirmPassword(id, handler) {
    const form = this.#modalForm();
    console.log(form);
    console.log(this._modalElement);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handler(id, this.#password());
      this.#clearPassword();
    });
  }

  addHandlerClickImportReports() {
    this.#btnImportReports.addEventListener(
      "click",
      this.confirmImport.bind(this)
    );
  }

  addHandlerImportReports(handler) {
    const form = this.#modalForm();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handler(id, this.#reports());
    });
  }
}

import ModalView from "./modalView.js";

export default class ModalFormView extends ModalView {
  constructor(modalElement) {
    super();
    this._modalElement = modalElement;
  }

  #btnImportReports = document.querySelector(".btn-import-reports");

  #password = () =>
    this._modalElement.querySelector(".hard-delete-password").value;
  #clearPassword() {
    this._modalElement.querySelector(".hard-delete-password").value = "";
  }

  #reports = () => this._modalElement.querySelector(".import-reports").value;
  #transferToUser = () =>
    this._modalElement.querySelector(".transfer-to-user").value;
  #clearReports() {
    this._modalElement.querySelector(".import-reports").value = "";
  }

  render(formHtml, headerText, replaceElement = true) {
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
    if (replaceElement) this._modalElement.replaceWith(newModalElement);
    this._modalElement = newModalElement;
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
            <p>Hard Delete Report</p>
          </button>
          <button type="button" class="modal-btn cancel">No, Cancel</button>
        </div>
      </form>
    `;
    return this.render(formHtml, headerText);
  }

  importReportsForm() {
    const replaceElement = false;
    const headerText = "Import Reports";
    const formHtml = `
      <form class="form" id="form-modal">
        <!-- REPORTS RAW JSON -->
        <div class="form-grouping-col">
          <textarea
            type="password"
            id="import-reports"
            name="import-reports"
            class="import-reports"
            placeholder=
              '[
  { "id": "xxxxxxxx-xxxx-4xxx...", "version": "x.x.x", <...> },
  { "id": "xxxxxxxx-xxxx-4xxx...", "version": "x.x.x", <...> },
  { "id": "xxxxxxxx-xxxx-4xxx...", "version": "x.x.x", <...> },
  { <...> }
]
'
            spellcheck="false"
            autocorrect="off"
            autocapitalize="off"
            wrap="off"
            required
          ></textarea>
          <label for="import-reports">Insert the raw JSON data of one or mutiple reports:</label>
        </div>

        <!-- CALL TO ACTION BUTTON -->
        <div class="modal-btns">
          <button
            type="submit"
            id="modal-btn-import"
            class="modal-btn import info"
          >
            <p>Import Reports</p>
          </button>
          <button type="button" class="modal-btn cancel">No, Cancel</button>
        </div>
      </form>
    `;
    return this.render(formHtml, headerText, replaceElement);
  }

  transferReportForm(users, isAllRelationships = false) {
    const replaceElement = false;
    const headerText = isAllRelationships
      ? "Transfer All Report Relationships"
      : "Transfer Report Ownership";
    const formHtml = `
      <form class="form" id="form-modal">
        <!-- REPORTS RAW JSON -->
        <div class="form-grouping-col">
          <select
            id="transfer-to-user"
            name="transfer-to-user"
            class="transfer-to-user"
            required
          >
            ${users.join("")}
          </select>
          <label for="transfer-to-user">${
            isAllRelationships
              ? "Transfer all report relationships"
              : "Transfer ownership of this report"
          } to:</label>
        </div>

        <!-- CALL TO ACTION BUTTON -->
        <div class="modal-btns">
          <button
            type="submit"
            id="modal-btn-transfer"
            class="modal-btn transfer info"
          >
            <p>${
              isAllRelationships
                ? "Transfer All Report Relationships"
                : "Transfer Report"
            }</p>
          </button>
          <button type="button" class="modal-btn cancel">No, Cancel</button>
        </div>
      </form>
    `;

    return this.render(formHtml, headerText, replaceElement);
  }

  addHandlerConfirmPassword(id, handler) {
    this._modalElement
      .querySelector("#form-modal")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const hardDeleteBtn =
          this._modalElement.querySelector(".modal-btn.error");
        this.renderSpinner(hardDeleteBtn);

        // function controlHardDeleteReport in ./reports/reportController.js
        await handler(id, this.#password());

        this.#clearPassword();
        this.clearSpinner(hardDeleteBtn, null, "hardDelete");
      });
  }

  addHandlerClickImportReports(handler) {
    this.#btnImportReports.addEventListener("click", (e) => {
      this.confirmImport.call(this);

      this._modalElement
        .querySelector("#form-modal")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const importBtn =
            this._modalElement.querySelector(".modal-btn.import");
          this.renderSpinner(importBtn);

          // function controlImportReports in ./reports/reportController.js
          await handler(this.#reports());

          this.clearSpinner(importBtn, null, "import");
        });
    });
  }

  addHandlerClickTransferReport(handler, reportFormView, users) {
    reportFormView._btnTransfer.addEventListener("click", (e) => {
      this.confirmTransferTo.call(this, users);

      this._modalElement
        .querySelector("#form-modal")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const transferBtn = this._modalElement.querySelector(
            ".modal-btn.transfer"
          );
          this.renderSpinner(transferBtn);

          // function controlTransfer in ./reports/reportController.js
          await handler(
            reportFormView._form.dataset.id,
            this.#transferToUser()
          );

          this.clearSpinner(transferBtn, null, "import");
        });
    });
  }

  // prettier-ignore
  addHandlerClickTransferAllReportRelationships(handler, userFormView, users) {
    userFormView._btnTransferAll.addEventListener("click", (e) => {
      const isAllRelationships = true;
      this.confirmTransferTo.call(this, users, isAllRelationships);

      this._modalElement
        .querySelector("#form-modal")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const transferBtn = this._modalElement.querySelector(
            ".modal-btn.transfer"
          );
          this.renderSpinner(transferBtn);

          // function controlTransfer in ./reports/reportController.js
          await handler(this.#transferToUser());

          this.clearSpinner(transferBtn, null, "import");
        });
    });
  }
}

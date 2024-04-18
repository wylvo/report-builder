import FormView from "../formView.js";

export class ModalFormView extends FormView {
  constructor(tabElement = undefined, formElement = undefined) {
    super(tabElement, formElement);

    this._btnHardDelete = this._form.querySelector(".modal-btn-confirm-hard");
    this._btnImport = this._form.querySelector(".modal-btn-import");
  }

  #password() {
    return this._fields.get("hard-delete-password").value;
  }

  #clearPassword() {
    this._fields.get("hard-delete-password").value = "";
  }

  addHandlerConfirmPassword(id, handler) {
    this._form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handler(id, this.#password());
      this.#clearPassword();
    });
  }

  addHandlerImportReports() {
    this._form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handler(id, this.#password());
    });
  }

  _generateFormHtml() {
    return `
      <div class="modal">
        <button class="modal-close-btn">&times;</button>
        <div class="form-header">
          <div>
            <h1>This operation is irreversible</h1>
          </div>
        </div>
        <form class="form" id="form-hard-delete">

          <!-- HARD DELETE PASSWORD -->
          <div class="form-grouping-col mt-36">
            <input type="password" id="hard-delete-password" name="hard-delete-password" class="hard-delete-password" placeholder="Confirm With Password" required />
            <label for="hard-delete-password">Password:</label>
          </div>

          <!-- CALL TO ACTION BUTTON -->
          <div class="modal-btns">
            <button type="submit" id="form-hard-delete-btn" class="modal-btn-confirm-hard error">Hard Delete Report</button>
            <button type="button" class="modal-btn-cancel">No, Cancel</button>
          </div>
        </form>
      </div>
    `;
  }

  generateFormElement() {
    return this.htmlStringToElement(this._generateFormHtml());
  }
}

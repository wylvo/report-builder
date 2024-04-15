import FormView from "../formView.js";

export class ModalFormView extends FormView {
  constructor(tabElement = undefined, formElement) {
    super(tabElement, formElement);

    this.password = this._fields.get("hard-delete-password");
    this._btnHardDelete = this._form.querySelector(".form-hard-delete-btn");
  }

  #clearPassword() {
    this.password.value = "";
    this.password.textContext = "";
  }

  _generateFormHtml() {
    return `
      <div class="modal">
        <button class="modal-close-btn">&times;</button>
        <div class="form-header">
          <div>
            <h1>Please confirm. This action is irreversible</h1>
          </div>
        </div>
        <form class="form" id="form-hard-delete">
          
          <!-- HARD DELETE PASSWORD -->
          <div class="form-grouping-col ">
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
          <div class="grid form-buttons">
            <label for="form-hard-delete-btn" class="cta-button">
              <button
                type="submit"
                id="form-hard-delete-btn"
                class="form-hard-delete-btn"
              >
                <svg class="icons">
                  <use href="/img/icons.svg#icon-delete"></use>
                </svg>
                <p class="form-hard-delete-btn-text">Hard Delete Report</p>
              </button>
            </label>
          </div>
        </form>
      </div>
    `;
  }

  generateFormElement() {
    return this.htmlStringToElement(this._generateFormHtml());
  }

  render() {
    console.log("I RAN");
    return this.generateFormElement();
  }

  addHandlerHardDelete(handler) {
    this._form.addEventListener("submit", function (e) {
      e.preventDefault();
      handler();
    });
  }
}

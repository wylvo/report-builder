import FormView from "../../_views/formView.js";
import { DEFAULT_PROFILE_PICTURE } from "../../config.js";

export class UserFormView extends FormView {
  // Accordions keys
  #USER = "user-profile-accordion";
  #PASS = "user-password-accordion";
  #DEFAULT_PICTURE = DEFAULT_PROFILE_PICTURE;

  // Generic key
  #ALL = "*";

  // prettier-ignore
  constructor(tabElement, formElement) {
    super(tabElement, formElement);

    // Initialize accordions
    this._accordions = this.initalizeAllAccordions();
    this._userAccordion = this._accordions.get(this.#USER);
    this._passAccordion = this._accordions.get(this.#PASS);

    // Tags
    this._tags = this._form.querySelectorAll(".tag");

    this._profilePictureURL = this._fields.get("profile-picture-uri");
    this._imgProfilePicture = this._form.querySelector(".form-profile-picture");

    // Label Password (will be modified)
    this._password = this._fields.get("password");
    this._passwordConfirmation = this._fields.get("password-confirmation");

    // Buttons
    this._btnPaste = this._form.querySelector(".form-paste-btn");
    this._btnCopy = this._form.querySelector(".form-copy-btn");
    this._btnNew = this._form.querySelector(".form-new-btn");
    this._btnSubmit = this._form.querySelector(".form-submit-btn");
    this._btnSubmitText = this._form.querySelector(".form-submit-btn-text");
    this._btnResetPassword = this._form.querySelector(".form-reset-password-btn");

    // Initialize default State
    this.#defaultState();

    // Initialize default handlers & expand accordions
    this.#init();
  }

  // Initialize default state
  #defaultState() {
    this._snapshot = { taken: false };
  }

  // Initialize default handlers & expand accordions
  #init() {
    this.newUser(true);
    this._expandAllAccordions();
    this._addHandlerCollapseExpandOrAccordion();
    this._addHandlerOnChange();
    this._addHandlerCheckPasswordsMatch();
    this._addHandlerUpdateProfilePicture();
  }

  // prettier-ignore
  initalizeAllAccordions() {
    const accordionElements = [...this._form.querySelectorAll(".form-grouping-accordion")];
    const mapKey = (i) => i === 0 ? this.#USER : i === 1 ? this.#PASS : i;
    const mapValue = (accordion) => ({ header: accordion, content: accordion.nextElementSibling });
    
    const allAccordionsByKeyName = accordionElements.map((accordion, i) =>
      [mapKey(i), mapValue(accordion)]
    );

    const allAccordions = [this.#ALL, new Map(accordionElements.map(accordion => 
      [accordion.parentElement, mapValue(accordion)]
    ))];

    return new Map([
      ...allAccordionsByKeyName,
      allAccordions
    ]);
  }

  // prettier-ignore
  // Compare a cloned version of the form with the current form state. Return list of changes.
  hasStateChanged(clone, state) {
    this._changes = [];
    clone.forEach((el, i) => {
      if(el.name === "password" ||
        el.name === "password-confirmation" ||
        el.name === "password-expiration" ||
        el.name === "enable-2fa"
      ) return;
      if (el.getAttribute("type") === "checkbox" && el.checked !== state.get(i).checked)
        this._changes.push(el.name);
      if (el.getAttribute("type") !== "checkbox" && el.value !== state.get(i).value)
        this._changes.push(el.name);
    });

    if (this._changes.length > 0) {
      this._btnSubmit.disabled = false;
      this._tab.classList.add("unsaved");
    } else {
      this._btnSubmit.disabled = true;
      this._tab.classList.remove("unsaved");
    }

    // console.log(this._changes);
    return {
      changes: this._changes,
    }
  }

  // prettier-ignore
  newUser(takeSnapshot = false) {
    this._tab.firstElementChild.textContent = "[Empty]";
    this._tab.firstElementChild.setAttribute("href", "#");

    this.#defaultState();
    this.clearTags();
    this._form.reset();

    this._imgProfilePicture.src = this.#DEFAULT_PICTURE;
    
    this._password.required = true;
    this._passwordConfirmation.required = true;
    this._password.nextElementSibling.textContent = "Password:";
    this._passwordConfirmation.nextElementSibling.textContent = "Confirm Password:";

    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Create User";
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-save");
    this._btnResetPassword.disabled = true;
    this._btnResetPassword.classList.add("hidden");

    this.updateTextInputsLength();

    if(takeSnapshot) this._snapshot = this.takeSnapshot();
  }

  render(user) {
    this.newUser();

    console.log(user);
    this._tab.firstElementChild.textContent = user.fullName;
    this._tab.firstElementChild.setAttribute("href", `#${user.uuid}`);

    const fields = this._fields;
    const checkBoxes = this._checkBoxes;
    const selects = this._selects;

    fields.get("full-name").value = user.fullName;
    fields.get("initials").value = user.initials;
    fields.get("email").value = user.email;
    fields.get("username").value = user.username;
    if (user.profilePictureURI === this.#DEFAULT_PICTURE)
      fields.get("profile-picture-uri").value = "";
    else fields.get("profile-picture-uri").value = user.profilePictureURI;
    selects.get("role").value = user.role;
    selects.get("status").value = user.active ? "1" : "0";

    // Update form tags
    this.updateTags(user);

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Take a new snapshot (Will help detecting changes in the form)
    this._snapshot = this.takeSnapshot();

    // Update form profile picture
    this._imgProfilePicture.src = user.profilePictureURI;

    // Password inputs not required
    this._password.required = false;
    this._passwordConfirmation.required = false;

    // Update password input labels
    this._password.nextElementSibling.textContent = "New Password:";
    this._passwordConfirmation.nextElementSibling.textContent =
      "Confirm New Password:";

    // Update submit (create) button
    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Update User";
    // prettier-ignore
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-sync");

    this._btnResetPassword.disabled = true;
    this._btnResetPassword.classList.remove("hidden");

    this._all(this._accordions).forEach((accordion) =>
      this._expandAccordion(accordion.header, accordion.content)
    );
  }

  updateTags(user) {
    const tags = [...this._tags];
    const isActive = user.active;
    const role = user.role;
    tags.forEach((tag) => {
      // User Status: Active || Inactive
      if (tag.classList.contains("user-status")) {
        if (!isActive)
          (tag.textContent = "INACTIVE"), tag.classList.remove("hidden");
        else tag.classList.add("hidden");
      }

      // On-call
      if (tag.classList.contains("user-role")) {
        if (role)
          (tag.textContent = role.toUpperCase()),
            tag.classList.remove("hidden");
        else tag.classList.add("hidden");
      }

      // Id
      if (tag.classList.contains("data-id"))
        (tag.textContent = user.uuid), tag.classList.remove("hidden");
    });
  }

  clearTags() {
    const tags = [...this._tags];
    tags.forEach((tag) => tag.classList.add("hidden"));
  }

  clearPasswordFields() {
    this._password.value = "";
    this._passwordConfirmation.value = "";
    this._btnResetPassword.disabled = false;
  }

  // prettier-ignore
  _collapseOrExpandAccordion(e) {
    const header = e.target.closest(".form-grouping-accordion");
    const content = e.target.closest(".form-grouping-accordion").nextElementSibling;
    if (content.style.maxHeight) this._collapseAccordion(header, content);
    else this._expandAccordion(header, content);
  }

  _expandAllAccordions() {
    this._all(this._accordions).forEach((accordion) =>
      this._expandAccordion(accordion.header, accordion.content)
    );
  }

  // prettier-ignore
  _expandAccordion(header, content) {
    if (header) header.querySelector(".icon-chevron").style.transform = "rotate(-180deg)";
    content.style.maxHeight = content.scrollHeight + 98 + "px";
    content.style.visibility = "visible";
    content.style.opacity = "1";
  }

  _collapseAccordion(header, content) {
    if (header) header.querySelector(".icon-chevron").style.transform = null;
    content.style.maxHeight = null;
    content.style.visibility = "hidden";
    content.style.opacity = "0";
  }

  // prettier-ignore
  _addHandlerCheckPasswordsMatch() {
    [this._password, this._passwordConfirmation].forEach((el) =>
      el.addEventListener("input", () => {
        if(this._password.value && this._passwordConfirmation.value) {
          if (this._password.value === this._passwordConfirmation.value)
            this._btnResetPassword.disabled = false;
          else this._btnResetPassword.disabled = true;
        }
      })
    );
  }

  _addHandlerUpdateProfilePicture() {
    this._profilePictureURL.addEventListener("change", () => {
      if (this._profilePictureURL.value === "")
        this._imgProfilePicture.src = this.#DEFAULT_PICTURE;
      else this._imgProfilePicture.src = this._profilePictureURL.value;
    });
  }

  // prettier-ignore
  _addHandlerCollapseExpandOrAccordion() {
    this._all(this._accordions).forEach((accordion) => {
      accordion.header.addEventListener("click", this._collapseOrExpandAccordion.bind(this));
    });
  }

  // Listen for changes in the form for inputs, checkboxes, selects, and textareas
  _addHandlerOnChange() {
    this._form.onchange = () => {
      if (this._snapshot.taken)
        this.hasStateChanged(this._snapshot.clone, this._snapshot.state);
    };
  }

  addHandlerNew(handlerUnsavedUser, handlerNew) {
    this._btnNew.addEventListener("click", () => {
      handlerUnsavedUser(handlerNew);
    });
  }

  addHandlerCopy(handler) {
    this._btnCopy.addEventListener("click", () => {
      handler(this._all(this._inputs));
    });
  }

  addHandlerPaste(handler) {
    this._btnPaste.addEventListener("click", () => {
      handler();
      this.updateTextInputsLength();
    });
  }

  addHandlerRender(handlerUnsavedUser, handlerRender) {
    ["hashchange", "load"].forEach((ev) =>
      window.addEventListener(ev, (e) => {
        e.preventDefault();
        handlerUnsavedUser(handlerRender);
      })
    );
  }

  addHandlerSave(handler) {
    this._form.addEventListener("submit", function (e) {
      e.preventDefault();
      handler();
    });
  }

  addHandlerResetPassword(handler) {
    this._btnResetPassword.addEventListener("click", function (e) {
      e.preventDefault();
      handler();
    });
  }
}

import FormView from "../formView.js";

export class UserFormView extends FormView {
  // Accordions keys
  #USER = "user-profile-accordion";
  #PASS = "user-password-accordion";

  // Generic key
  #ALL = "*";

  // prettier-ignore
  constructor(tabElement, formElement) {
    super(tabElement, formElement);

    // Initialize accordions
    this._accordions = this.initalizeAllAccordions();
    this._userAccordion = this._accordions.get(this.#USER);
    this._passAccoridon = this._accordions.get(this.#PASS);

    // Tags
    this._tags = this._form.querySelectorAll(".tag");

    // Buttons
    this._btnPaste = this._form.querySelector(".form-paste-btn");
    this._btnCopy = this._form.querySelector(".form-copy-btn");
    this._btnNew = this._form.querySelector(".form-new-btn");
    this._btnSubmit = this._form.querySelector(".form-submit-btn");
    this._btnSubmitText = this._form.querySelector(".form-submit-btn-text");

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

    this._fields.forEach((field) => (field.value = ""));
    this._form.reset();

    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Create User";
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-save");

    this.updateTextInputsLength();

    if(takeSnapshot) this._snapshot = this.takeSnapshot();
  }

  render(user) {
    this.newUser();

    this._tab.firstElementChild.textContent = user.fullName;
    this._tab.firstElementChild.setAttribute("href", `#${user.id}`);

    const fields = this._fields;
    const checkBoxes = this._checkBoxes;
    const selects = this._selects;
    const textAreas = this._textAreas;

    console.log(fields, checkBoxes, selects, textAreas);

    // Update form tags
    this.updateTags(user);

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Take a new snapshot (Will help detecting changes in the form)
    this._snapshot = this.takeSnapshot();

    // Update submit (save) button
    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Save Changes";
    // prettier-ignore
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-sync");

    this._all(this._accordions).forEach((accordion) =>
      this._expandAccordion(accordion.header, accordion.content)
    );
  }

  updateTags(report) {
    const tags = [...this._tags];
    const isProcedural = report.incident.isProcedural;
    const isOnCall = report.tech.isOnCall;
    tags.forEach((tag) => {
      // Procedural
      if (tag.classList.contains("report-procedural")) {
        if (isProcedural)
          (tag.textContent = "PROCEDURAL"), tag.classList.remove("hidden");
        else tag.classList.add("hidden");
      }

      // On-call
      if (tag.classList.contains("report-oncall")) {
        if (isOnCall)
          (tag.textContent = "ON-CALL"), tag.classList.remove("hidden");
        else tag.classList.add("hidden");
      }

      // Id
      if (tag.classList.contains("report-id"))
        (tag.textContent = report.id), tag.classList.remove("hidden");
    });
  }

  clearTags() {
    const tags = [...this._tags];
    tags.forEach((tag) => tag.classList.add("hidden"));
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

  addHandlerNew(handlerUnsavedUser, handlerNew) {
    this._btnNew.addEventListener("click", () => {
      handlerUnsavedUser(handlerNew);
    });
  }

  // prettier-ignore
  _addHandlerCollapseExpandOrAccordion() {
    this._all(this._accordions).forEach((accordion) => {
      accordion.header.addEventListener("click", this._collapseOrExpandAccordion.bind(this));
    });
  }

  // Listen for changes in the form for inputs, checkboxes, and textareas
  _addHandlerOnChange() {
    this._form.onchange = () => {
      if (this._snapshot.taken)
        this.hasStateChanged(this._snapshot.clone, this._snapshot.state);
    };
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
}

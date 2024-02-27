import View from "./View.js";

export class ReportView extends View {
  // Inputs keys
  #FIELDS = "all-fields";
  #CHECKBOXES = "all-checkboxes";
  #SELECTS = "all-selects";
  #TEXTAREAS = "all-textareas";

  // Accordions keys
  #CALL = "phone-call-accordion";
  #STORE = "store-information-accordion";
  #DETAILS = "incident-details-accordion";

  // Generic key
  #ALL = "*";

  #btnTeamsState;

  // prettier-ignore
  constructor(tabElement, formElement) {
    super();
    this._tab = tabElement;
    this._form = formElement;

    // Initialize inputs (includes checkboxes, selects & text areas)
    this._inputs = this.initializeAllInputs(this._form);
    this._fields = this._inputs.get(this.#FIELDS);
    this._checkBoxes = this._inputs.get(this.#CHECKBOXES);
    this._selects = this._inputs.get(this.#SELECTS);
    this._textAreas = this._inputs.get(this.#TEXTAREAS);

    // Initialize text inputs with the "maxlength" HTML attribute
    this._maxLengthInputs = this.initTextInputsWithMaxLength(this._inputs.get("*"));

    // Initialize accordions
    this._accordions = this.initalizeAllAccordions();
    this._callAccordion = this._accordions.get(this.#CALL);
    this._storeAccordion = this._accordions.get(this.#STORE);
    this._detailsAccordion = this._accordions.get(this.#DETAILS);

    // Function for all inputs or all accordions
    this._all = (elements) => elements.get(this.#ALL);

    // Tags
    this._tags = this._form.querySelectorAll(".tag");

    // Buttons
    this._btnPaste = this._form.querySelector(".form-paste-btn");
    this._btnCopy = this._form.querySelector(".form-copy-btn");
    this._btnNew = this._form.querySelector(".form-new-btn");
    this._btnNow = this._form.querySelector(".form-now-btn");
    this._btnSubmit = this._form.querySelector(".form-submit-btn");
    this._btnSubmitText = this._form.querySelector(".form-submit-btn-text");
    this._btnTeams = this._form.querySelector(".form-teams-btn");

    // Initialize default State
    this.#defaultState();

    // Initialize default handlers & expand accordions
    this.#init();
  }

  // Initialize default state
  #defaultState() {
    this._snapshot = { taken: false };
    this._phoneNumberInitialValue = "";
    this._incidentDateInitialValue = "";
    this._incidentTimeInitialValue = "";
    this._transactionIssue = false;
  }

  // Initialize default handlers & expand accordions
  #init() {
    this.newReport(true);
    this.updateTextInputsLength();
    this._expandAllAccordions();
    this._addHandlerTimestampNow();
    this._addHandlerTextInputMaxLength();
    this._addHandlerCollapseExpandOrAccordion();
    this._addHandlerCopyDateTime();
    this._addHandlerNoCallerIdSwitch();
    this._addHandlerTransactionIssueSwitch();
    this._addHandlerOnChange();
  }

  // prettier-ignore
  // Initialize all form input types. Returns a Map() object. Keys are input types. Values are elements
  initializeAllInputs(form) {
    const fieldElements = [...form.getElementsByTagName("input")]
      .filter((el) => el.getAttribute("type") !== "checkbox");
    const checkBoxElements = [...form.getElementsByTagName("input")]
      .filter((el) => el.getAttribute("type") === "checkbox");
    const selectElements = [...form.getElementsByTagName("select")];
    const textAreaElements = [...form.getElementsByTagName("textarea")];

    const keyValue = (array) => array.map((element) => [element.name, element]);

    const fields = new Map(keyValue(fieldElements));
    const checkBoxes = new Map(keyValue(checkBoxElements));
    const selects = new Map(keyValue(selectElements));
    const textAreas = new Map(keyValue(textAreaElements));
    const allInputs = new Map([...checkBoxes, ...fields, ...selects, ...textAreas]);

    return new Map([
      [this.#FIELDS, fields],
      [this.#CHECKBOXES, checkBoxes],
      [this.#SELECTS, selects],
      [this.#TEXTAREAS, textAreas],
      [this.#ALL, allInputs],
    ]);
  }

  // prettier-ignore
  initTextInputsWithMaxLength(allInputs) {
    const maxLengthInputs = new Map();
    allInputs.forEach((input) => {
      if (input.hasAttribute("maxlength") && input.name !== "phone-number") {
        maxLengthInputs.set(input, input.parentElement);
        input.parentElement.querySelector(".max-length-text").textContent = input.getAttribute("maxlength");
      }
    });
    return maxLengthInputs;
  }

  // prettier-ignore
  initalizeAllAccordions() {
    const accordionElements = [...this._form.querySelectorAll(".form-grouping-accordion")];
    const mapKey = (i) => i === 0 ? this.#CALL : i === 1 ? this.#STORE : i === 2 ? this.#DETAILS : i;
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

  // Form clone (To be referenced whenever there are changes in the form)
  newClone(isDeep = true) {
    return this._form.cloneNode(isDeep);
  }

  // prettier-ignore
  // Make clone select element equal to state select element. (A default clone does not apply this).
  #deepSnapshot(clone, state) {
    const cloneSelects = clone.get(this.#SELECTS);
    const stateSelects = state.get(this.#SELECTS);
    stateSelects.forEach(
      (stateSelect, i) => (cloneSelects.get(i).selectedIndex = stateSelect.selectedIndex)
    );
    return clone;
  }

  // Take a snapshot of the report by cloning the form element
  takeSnapshot(snapshot) {
    snapshot = snapshot ? snapshot : this.newClone(true);

    // State of the report inputs
    const state = this._inputs;

    // Clone of the report inputs
    const weakClone = this.initializeAllInputs(snapshot);
    const clone = this.#deepSnapshot(weakClone, state);

    // Check for changes between state & clone. Update changes array
    this.hasStateChanged(state.get(this.#ALL), clone.get(this.#ALL));

    return (this._snapshot = {
      state: state.get(this.#ALL),
      clone: clone.get(this.#ALL),
      taken: true,
    });
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
      this._btnTeams.disabled = true;
      this._tab.classList.add("unsaved");
    } else {
      this._btnSubmit.disabled = true;
      this._btnTeams.disabled = this.#btnTeamsState;
      this._tab.classList.remove("unsaved");
    }

    // console.log(this._changes);
    return {
      changes: this._changes,
    }
  }

  // prettier-ignore
  newReport(takeSnapshot = false) {
    this._tab.firstElementChild.textContent = "[Empty]";
    this._tab.firstElementChild.setAttribute("href", "#");

    this.#defaultState();
    this.clearTags();

    this._fields.forEach((field) => (field.value = ""));
    this._form.reset();

    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Save Report";
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-save");

    this._checkBoxes.get("phone-no-caller-id").checked = false;
    this._fields.get("phone-number").disabled = false;

    this._checkBoxes.get("copy-timestamp").checked = true;
    this._fields.get("incident-date").disabled = true;
    this._fields.get("incident-time").disabled = true;

    this._transactionIssueSwitch();
    this.updateTextInputsLength();

    if(takeSnapshot) this._snapshot = this.takeSnapshot();
    this._btnTeams.disabled = true;
    this.#btnTeamsState = this._btnTeams.disabled;

  }

  render(report) {
    this.newReport();

    this._tab.firstElementChild.textContent = report.incident.title;
    this._tab.firstElementChild.setAttribute("href", `#${report.id}`);

    const fields = this._fields;
    const checkBoxes = this._checkBoxes;
    const selects = this._selects;
    const textAreas = this._textAreas;

    // Phone Call Accordion
    fields.get("date").value = report.call.date;
    fields.get("time").value = report.call.time;

    selects.get("status").value = report.call.status;

    report.call.phone.includes("No Caller ID") &&
    !checkBoxes.get("phone-no-caller-id").checked
      ? checkBoxes.get("phone-no-caller-id").click()
      : (fields.get("phone-number").value = report.call.phone);

    // Store Information Accordion
    fields.get("store-number").value = report.store.number;
    fields.get("store-employee").value = report.store.employee.name;

    report.store.employee.isStoreManager &&
    !checkBoxes.get("store-manager").checked
      ? (checkBoxes.get("store-manager").checked = true)
      : (checkBoxes.get("store-manager").checked = false);

    selects.get("store-dm").value = report.store.districtManager.username;

    report.store.districtManager.isContacted &&
    !checkBoxes.get("store-dm-contacted").checked
      ? (checkBoxes.get("store-dm-contacted").checked = true)
      : (checkBoxes.get("store-dm-contacted").checked = false);

    // Incident Details Accordion
    fields.get("incident-title").value = report.incident.title;
    fields.get("incident-date").value = report.incident.date;
    fields.get("incident-time").value = report.incident.time;

    report.incident.copyTimestamp && !checkBoxes.get("copy-timestamp").checked
      ? checkBoxes.get("copy-timestamp").click()
      : "";
    selects.get("incident-type").value = report.incident.type;
    fields.get("incident-pos-number").value = report.incident.pos;

    report.incident.isProcedural &&
    !checkBoxes.get("incident-procedural").checked
      ? (checkBoxes.get("incident-procedural").checked = true)
      : (checkBoxes.get("incident-procedural").checked = false);

    fields.get("incident-error-code").value = report.incident.error;

    // Transaction Issue & Details
    if (
      !this.isEmptyObject(report.incident.transaction) &&
      !checkBoxes.get("transaction-issue").checked
    ) {
      checkBoxes.get("transaction-issue").click();
      selects.get("transaction-type").value = report.incident.transaction.type;

      fields.get("transaction-number").value =
        report.incident.transaction.number;

      report.incident.transaction.isIRCreated &&
      !["transaction-incident-report"].checked
        ? (["transaction-incident-report"].checked = true)
        : (["transaction-incident-report"].checked = false);
    }
    textAreas.get("incident-details").value = report.incident.details;

    // TECH Signature & On-Call
    selects.get("tech-employee").value = report.tech.username;
    report.tech.isOnCall && !checkBoxes.get("oncall").checked
      ? (checkBoxes.get("oncall").checked = true)
      : (checkBoxes.get("oncall").checked = false);

    // Update form tags
    this.updateTags(report);

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Take a new snapshot (Will help detecting changes in the form)
    this._snapshot = this.takeSnapshot();

    // Update submit (save) button
    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Save Changes";
    // prettier-ignore
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-sync");

    // If sent by webhook disable teams button
    if (report.isWebhookSent) this._btnTeams.disabled = true;
    else this._btnTeams.disabled = false;
    this.#btnTeamsState = this._btnTeams.disabled;

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

  // prettier-ignore
  updateTextInputsLength() {
    this._maxLengthInputs.forEach((container, input) => {
      const currentLengthElement = container.querySelector(`#${input.id}-length`);
      currentLengthElement.textContent = input.value.length;
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

  // prettier-ignore
  _copyDateTime(e) {
    const copyDateTime = this._checkBoxes.get("copy-timestamp");
    const isCopyChecked = copyDateTime.checked;
    const incidentDate = this._fields.get("incident-date");
    const incidentTime = this._fields.get("incident-time");
    
    if (isCopyChecked && e.target.name === "date") incidentDate.value = e.target.value;
    if (isCopyChecked && e.target.name === "time") incidentTime.value = e.target.value;

    if (!isCopyChecked && e.target.name === copyDateTime.name)
      this._clearIncidentDateTime(isCopyChecked, this._fields)
    else
      this._clearIncidentDateTime(isCopyChecked, this._fields)
  }

  _clearIncidentDateTime(isChecked, inputFields) {
    const incidentDate = inputFields.get("incident-date");
    const incidentTime = inputFields.get("incident-time");
    const callDate = inputFields.get("date");
    const callTime = inputFields.get("time");

    if (isChecked) {
      this._incidentDateInitialValue = incidentDate.value;
      this._incidentTimeInitialValue = incidentTime.value;
      incidentDate.value = callDate.value;
      incidentTime.value = callTime.value;
      incidentDate.disabled = true;
      incidentTime.disabled = true;
      return;
    }
    incidentDate.value = this._incidentDateInitialValue;
    incidentTime.value = this._incidentTimeInitialValue;
    incidentDate.disabled = false;
    incidentTime.disabled = false;
  }

  // prettier-ignore
  _noCallerId(e) {
    const noCallerID = this._checkBoxes.get("phone-no-caller-id");
    const phoneNumber = this._fields.get("phone-number");
    if (noCallerID.checked && e.target.name === noCallerID.name) {
      this._phoneNumberInitialValue = phoneNumber.value;
      phoneNumber.value = "No Caller ID";
      phoneNumber.disabled = true;
      return;
    }
    phoneNumber.value = this._phoneNumberInitialValue;
    phoneNumber.disabled = false;
  }

  _transactionIssueSwitch() {
    if (this._transactionIssue) {
      this._selects.get("transaction-type").disabled = false;
      this._fields.get("transaction-number").disabled = false;
      this._checkBoxes.get("transaction-incident-report").disabled = false;
    } else {
      this._selects.get("transaction-type").disabled = true;
      this._fields.get("transaction-number").disabled = true;
      this._checkBoxes.get("transaction-incident-report").disabled = true;
    }
    return (this._transactionIssue = !this._transactionIssue);
  }

  addHandlerNew(handlerUnsavedReport, handlerNew) {
    this._btnNew.addEventListener("click", () => {
      handlerUnsavedReport(handlerNew);
    });
  }

  // prettier-ignore
  _addHandlerTimestampNow() {
    this._btnNow.addEventListener("click", () => {
      const now = new Date();
      const m = now.getMonth() + 1
      const month = m.toString().length === 1 ? `0${m}` : m;
      const date = now.getDate().toString().length === 1 ? `0${now.getDate()}` : now.getDate();
      const hours = now.getHours().toString().length === 1 ? `0${now.getHours()}` : now.getHours();
      const minutes = now.getMinutes().toString().length === 1 ? `0${now.getMinutes()}` : now.getMinutes();
      const formattedDate = [now.getFullYear(), "-", month, "-", date, " ", hours, ":", minutes]
        .join("")
        .split(" ");

      this._fields.get("date").value = formattedDate[0];
      this._fields.get("time").value = formattedDate[1];
      if (this._checkBoxes.get("copy-timestamp").checked) {
        this._fields.get("incident-date").value = formattedDate[0];
        this._fields.get("incident-time").value = formattedDate[1];
      }

      if (this._snapshot.taken)
        this.hasStateChanged(this._snapshot.clone, this._snapshot.state);
    });
  }

  // prettier-ignore
  _addHandlerTextInputMaxLength() {
    this._maxLengthInputs.forEach((container, input) => {
      input.addEventListener("input", () => {
        const currentLengthElement = container.querySelector(`#${input.id}-length`);
        currentLengthElement.textContent = input.value.length;
      });
    });
  }

  // prettier-ignore
  _addHandlerCollapseExpandOrAccordion() {
    this._all(this._accordions).forEach((accordion) => {
      accordion.header.addEventListener("click", this._collapseOrExpandAccordion.bind(this));
    });
  }

  // prettier-ignore
  _addHandlerCopyDateTime() {
    const callDate = this._fields.get("date");
    const callTime = this._fields.get("time");

    [callDate, callTime].forEach((field) =>
      field.addEventListener("input", this._copyDateTime.bind(this))
    );

    const copyDateTimeCheckBox = this._checkBoxes.get("copy-timestamp");
    copyDateTimeCheckBox.addEventListener("click", this._copyDateTime.bind(this));
  }

  // prettier-ignore
  _addHandlerNoCallerIdSwitch() {
    const noCallerIdCheckBox = this._checkBoxes.get("phone-no-caller-id");
    noCallerIdCheckBox.addEventListener("click", this._noCallerId.bind(this));
  }

  // prettier-ignore
  _addHandlerTransactionIssueSwitch() {
    const transactionIssueCheckBox = this._checkBoxes.get("transaction-issue");
    transactionIssueCheckBox.addEventListener("click", this._transactionIssueSwitch.bind(this));
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
    this._btnPaste.addEventListener("click", function () {
      handler();
    });
  }

  addHandlerRender(handlerUnsavedReport, handlerRender) {
    ["hashchange", "load"].forEach((ev) =>
      window.addEventListener(ev, (e) => {
        e.preventDefault();
        handlerUnsavedReport(handlerRender);
      })
    );
  }

  addHandlerSave(handler) {
    this._form.addEventListener("submit", function (e) {
      e.preventDefault();
      handler();
    });
  }

  addHandlerSend(handler) {
    this._btnTeams.addEventListener("click", function (e) {
      e.preventDefault();
      handler();
    });
  }
}

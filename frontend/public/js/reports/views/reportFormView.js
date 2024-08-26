import FormView from "../../_views/formView.js";

export class ReportFormView extends FormView {
  // Accordions keys
  #CALL = "phone-call-accordion";
  #STORE = "store-information-accordion";
  #DETAILS = "incident-details-accordion";

  // Generic key
  #ALL = "*";

  #btnTeamsState;

  users;
  districtManagers;

  constructor(tabElement, formElement) {
    super(tabElement, formElement);

    // Initialize accordions
    this._accordions = this.initalizeAllAccordions();
    this._callAccordion = this._accordions.get(this.#CALL);
    this._storeAccordion = this._accordions.get(this.#STORE);
    this._detailsAccordion = this._accordions.get(this.#DETAILS);

    // Multiselects (only applicable for ReportFormView)
    this._multiselects = this.initializeMultiselects();

    // Report info tooltip
    this._info = this._form.querySelector(".report-info .tooltiptext");

    // Tags
    this._tags = this._form.querySelectorAll(".tag");

    // District Managers Container
    this._districtManagersContainer =
      this._form.querySelector(".district-managers");

    // On-call time range form data
    this.onCallTimeRange = {};

    // Buttons
    this._btnPaste = this._form.querySelector(".form-btn.paste");
    this._btnCopy = this._form.querySelector(".form-btn.copy");
    this._btnTransfer = this._form.querySelector(".form-btn.transfer");
    this._btnNew = this._form.querySelector(".form-btn.new");
    this._btnNow = this._form.querySelector(".form-btn.now");
    this._btnSubmit = this._form.querySelector(".form-btn.submit");
    this._btnSubmitText = this._form.querySelector(".form-submit-btn-text");
    this._btnTeams = this._form.querySelector(".form-btn.ms-teams");

    // Initialize default State
    this.#defaultState();

    // Initialize default handlers & expand accordions
    this.#init();
  }

  // Initialize default state
  #defaultState() {
    this._snapshot = { taken: false };
    this._phoneNumberInitialValue = "";
    this._transactionIssue = false;
  }

  // Initialize default handlers & expand accordions
  #init() {
    this._expandAllAccordions();
    this._addHandlerTimestampNow();
    this._addHandlerCollapseExpandOrAccordion();
    this._addHandlerNoCallerIdSwitch();
    this._addHandlerTransactionIssueSwitch();
    this._addHandlerOnChange();
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

  initializeMultiselects() {
    const multiselects = new Map();
    this._selects.forEach((element, name) => {
      if (element.hasAttribute("multiple")) multiselects.set(name, element);
    });
    return multiselects;
  }

  // prettier-ignore
  // Compare a cloned version of the form with the current form state. Return list of changes.
  hasStateChanged(clone, state) {
    this._changes = [];
    clone.forEach((el, i) => {
      if (el.name === "") return;
      
      if (el.name === state.get(i).name) {
        if (el.getAttribute("type") === "checkbox" && el.checked !== state.get(i).checked)
          this._changes.push(el.name);

        if (el.hasAttribute("multiple")) {
          const multiselectOptions = [...el.options];
          
          multiselectOptions.forEach((option, j) => {
            const stateOption = state.get(i).options[j];
            const isSameValue = option.value === stateOption.value;
            const isSelected = option.selected === stateOption.selected;

            if (isSameValue && !isSelected)
              this._changes.push(`${el.name}-${option.value}`);
          });
        }
        else if (el.getAttribute("type") !== "checkbox" && el.value !== state.get(i).value)
          this._changes.push(el.name);
      }
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
    this._form.removeAttribute("data-id");

    this.#defaultState();
    this.clearInfo();
    this.clearTags();
    this.clearDistrictManagers();

    this._fields.forEach((field) => (field.value = ""));
    this._form.reset();

    this._btnTransfer.classList.add("hidden");
    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Create Report";
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-save");

    if (this._btnSubmit.children[2]) this._btnSubmit.children[2].remove();
    if (this._btnTeams.children[2]) this._btnTeams.children[2].remove();

    this._checkBoxes.get("phone-no-caller-id").checked = false;
    this._fields.get("phone-number").disabled = false;

    this._selects.get("assigned-to").value = this.currentUser?.username;

    if (this.isCurrentTimeOnCall())
      this._checkBoxes.get("oncall").checked = true;

    this._transactionIssueSwitch();
    this.updateTextInputsLength();

    if(takeSnapshot) this._snapshot = this.takeSnapshot();

    this._btnTeams.disabled = true;
    this.#btnTeamsState = this._btnTeams.disabled;
    this._btnSubmit.classList.remove("hidden");
    this._btnTeams.classList.remove("hidden");
  }

  render(report) {
    this.newReport();

    if (report.isDeleted) {
      this._btnTransfer.classList.add("hidden");
      this._btnSubmit.classList.add("hidden");
      this._btnTeams.classList.add("hidden");
    }
    if (!report.isDeleted) {
      this._btnTransfer.classList.remove("hidden");
      this._btnSubmit.classList.remove("hidden");
      this._btnTeams.classList.remove("hidden");
    }

    if (
      this.currentUser?.username &&
      this.currentUser.username !== report.createdBy
    ) {
      this._btnTransfer.classList.add("hidden");
      this._btnSubmit.classList.add("hidden");
      this._btnTeams.classList.add("hidden");
    }

    this._tab.firstElementChild.textContent = report.incident.title;
    this._tab.firstElementChild.setAttribute("href", `#${report.id}`);
    this._form.setAttribute("data-id", report.id);

    const fields = this._fields;
    const checkBoxes = this._checkBoxes;
    const selects = this._selects;
    const multiselects = this._multiselects;
    const textAreas = this._textAreas;

    // Phone Call Date & Time
    fields.get("date").value = report.call.date;
    fields.get("time").value = report.call.time;

    // Phone Call Status
    selects.get("status").value = report.call.status;

    report.call.phone.includes("No Caller ID") &&
    !checkBoxes.get("phone-no-caller-id").checked
      ? checkBoxes.get("phone-no-caller-id").click()
      : (fields.get("phone-number").value = report.call.phone);

    // Store Numbers
    report.store.numbers.forEach((storeNumber) => {
      const storeNumbers = selects.get("store-numbers");
      const options = [...storeNumbers.options];
      const index = options.findIndex((option) => option.value === storeNumber);

      storeNumbers.options[index].selected = true;
    });

    // Store Employee Name
    fields.get("store-employee").value = report.store.employee.name;

    // Store Employee Store Manager Checkbox
    report.store.employee.isStoreManager &&
    !checkBoxes.get("store-manager").checked
      ? (checkBoxes.get("store-manager").checked = true)
      : (checkBoxes.get("store-manager").checked = false);

    // Incident Types
    fields.get("incident-title").value = report.incident.title;
    report.incident.types.forEach((incidentType) => {
      const incidentTypes = selects.get("incident-types");
      const options = [...incidentTypes.options];
      const index = options.findIndex(
        (option) => option.value === incidentType
      );

      incidentTypes.options[index].selected = true;
    });

    // Incident POS Number
    selects.get("incident-pos-number").value = report.incident.pos;

    // Incident Procedural Checkbox
    report.incident.isProcedural &&
    !checkBoxes.get("incident-procedural").checked
      ? (checkBoxes.get("incident-procedural").checked = true)
      : (checkBoxes.get("incident-procedural").checked = false);

    // Incident Error Code
    fields.get("incident-error-code").value = report.incident.error;

    // Incident Variance Report Checkbox
    report.incident.hasVarianceReport &&
    !checkBoxes.get("incident-variance-report").checked
      ? (checkBoxes.get("incident-variance-report").checked = true)
      : (checkBoxes.get("incident-variance-report").checked = false);

    // Incident Transaction Issue
    if (
      !this.isEmptyObject(report.incident.transaction) &&
      !checkBoxes.get("transaction-issue").checked
    ) {
      checkBoxes.get("transaction-issue").click();

      // Incident Transaction Types
      report.incident.transaction.types.forEach((incidentTransactionType) => {
        const incidentTransactionTypes = selects.get("transaction-types");
        const options = [...incidentTransactionTypes.options];
        const index = options.findIndex(
          (option) => option.value === incidentTransactionType
        );

        incidentTransactionTypes.options[index].selected = true;
      });

      // Incident Transaction Number
      fields.get("transaction-number").value =
        report.incident.transaction.number;
    }

    // Incident Details
    textAreas.get("incident-details").value = report.incident.details;

    // Assigned To Signature
    selects.get("assigned-to").value = report.assignedTo;

    // On-Call Checkbox
    report.isOnCall && !checkBoxes.get("oncall").checked
      ? (checkBoxes.get("oncall").checked = true)
      : (checkBoxes.get("oncall").checked = false);

    // Load multiselections for all multiselects elements
    multiselects.forEach((multiselects) => multiselects.loadOptions());

    // Update & reveal created by, created at, updated by, updated at
    this.updateInfo(report);

    // Update form tags
    this.updateTags(report);

    // Update report district manager tags
    this.updateDistrictManagers(report);

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Take a new snapshot (Will help detecting changes in the form)
    this._snapshot = this.takeSnapshot();

    // Update submit (save) button
    this._btnSubmit.disabled = true;
    this._btnSubmit.children[1].textContent = "Update Report";
    // prettier-ignore
    this._btnSubmit.firstElementChild.firstElementChild.setAttribute("href", "/img/icons.svg#icon-sync");

    // If sent by webhook disable teams button
    if (report.isWebhookSent) this._btnTeams.disabled = true;
    else this._btnTeams.disabled = false;
    this.#btnTeamsState = this._btnTeams.disabled;

    // Expand accordions
    this._all(this._accordions).forEach((accordion) =>
      this._expandAccordion(accordion.header, accordion.content)
    );
  }

  // prettier-ignore
  updateInfo(report) {
    const infoHtml = (type, username, profilePictureURI, timeAgo) => `
      <div class="info">
        ${type === "createdBy" ? "Created by:" : "Updated by:"}
        <span class="user">
          <img class="profile-picture" src="${profilePictureURI}" alt="Profile picture of ${username.escapeHTML()}" />
          <span class="username">${username.escapeHTML()}</span>
        </span>
        <span class="time">${timeAgo.escapeHTML()}</span>
      </div>
    `;

    const formatTimeAgo = (timeAgo) => {
      const [timeNumber1, timeUnit1, timeNumber2, timeUnit2] = timeAgo.split(" ");
      
      return timeAgo.split(" ").length > 3
        ? [timeNumber1, timeUnit1, timeNumber2, timeUnit2, "ago"].join(" ")
        : [timeNumber1, timeUnit1, timeNumber2].join(" ");
    }

    if (!this.users) return;

    const userCreatedBy = this.users.find((user) => user.username === report.createdBy);
    if (!userCreatedBy) return;

    const createdTimeAgo = this.timeAgo(report.createdAt);
    const createdByElement = this.htmlStringToElement(
      infoHtml("createdBy", userCreatedBy.username, userCreatedBy.profilePictureURI, formatTimeAgo(createdTimeAgo))
    );

    this._info.appendChild(createdByElement);
    this._info.parentElement.classList.remove("hidden");
    this._info.classList.remove("hidden");

    if (report.createdAt !== report.updatedAt) {
      const userUpdatedBy = this.users.find((user) => user.username === report.updatedBy);
      if (!userUpdatedBy) return;

      const updatedTimeAgo = this.timeAgo(report.updatedAt);
      const updatedByElement = this.htmlStringToElement(
        infoHtml("updatedBy", userUpdatedBy.username, userUpdatedBy.profilePictureURI, formatTimeAgo(updatedTimeAgo))
      );
      this._info.appendChild(updatedByElement);
    }
  }

  clearInfo() {
    this._info.innerHTML = "";
    this._info.parentElement.classList.add("hidden");
  }

  updateTags(report) {
    const tags = [...this._tags];
    const isProcedural = report.incident.isProcedural;
    const isOnCall = report.isOnCall;
    const isDeleted = report.isDeleted;
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

      // Deleted
      if (tag.classList.contains("report-deleted")) {
        if (isDeleted)
          (tag.textContent = "DELETED"), tag.classList.remove("hidden");
        else tag.classList.add("hidden");
      }

      // Id
      if (tag.classList.contains("data-id"))
        (tag.textContent = report.id), tag.classList.remove("hidden");
    });
  }

  clearTags() {
    const tags = [...this._tags];
    tags.forEach((tag) => tag.classList.add("hidden"));
  }

  updateDistrictManagers(report) {
    this._districtManagersContainer.innerHTML = "";
    const districtManagerHtml = (fullName, profilePictureURI) => `
      <div class="dm">
        <img class="dm-profile-picture" alt="District manager profile picture of ${fullName.escapeHTML()}" src="${profilePictureURI}" />
        <p>${fullName.escapeHTML()}</p>
      </div>
    `;

    for (const districtManager of report.store.districtManagers) {
      for (const dM of this.districtManagers) {
        if (dM.username === districtManager.username) {
          const districtManagerElement = this.htmlStringToElement(
            districtManagerHtml(dM.fullName, dM.profilePictureURI)
          );
          this._districtManagersContainer.appendChild(districtManagerElement);
          break;
        }
      }
    }
  }

  clearDistrictManagers() {
    this._districtManagersContainer.innerHTML = "";
    const emtpyElement = this.htmlStringToElement(
      `<div class="dm">
        <img class="dm-profile-picture" alt="District manager profile picture" src="/img/default_profile_picture.jpg"/>
        <p>None</p>
      </div>
      `
    );
    this._districtManagersContainer.appendChild(emtpyElement);
  }

  isCurrentTimeOnCall(date = undefined) {
    date = !date ? (date = new Date(Date.now())) : date;

    const dayOfWeek = date.getDay();
    const currentHours = date.getHours();
    const currentMinutes = date.getMinutes();
    const excludeWeekends = this.onCallTimeRange.excludeWeekends;

    // Exclude weekends (0 = Sunday, 6 = Saturday)
    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return true; // Entire weekend is considered on-call
    }

    const onCallStartTimeHours = this.onCallTimeRange.startTime.hours;
    const onCallStartTimeMinutes = this.onCallTimeRange.startTime.minutes;
    const onCallEndTimeHours = this.onCallTimeRange.endTime.hours;
    const onCallEndTimeMinutes = this.onCallTimeRange.endTime.minutes;

    // Convert times to minutes since midnight
    const currentTime = currentHours * 60 + currentMinutes;
    const startTime = onCallStartTimeHours * 60 + onCallStartTimeMinutes;
    const endTime = onCallEndTimeHours * 60 + onCallEndTimeMinutes;

    // Check if the time is outside the range
    return currentTime < startTime || currentTime > endTime;
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
      this._selects
        .get("transaction-types")
        .parentElement.lastElementChild.classList.remove("disabled");
      this._selects.get("transaction-types").disabled = false;
      this._selects.get("transaction-types").setAttribute("required", "");
      this._fields.get("transaction-number").disabled = false;
    } else {
      this._selects
        .get("transaction-types")
        .parentElement.lastElementChild.classList.add("disabled");
      this._selects.get("transaction-types").disabled = true;
      this._fields.get("transaction-number").disabled = true;
      this._selects.get("transaction-types").removeAttribute("required");
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

      if (this._snapshot.taken)
        this.hasStateChanged(this._snapshot.clone, this._snapshot.state);
    });
  }

  // prettier-ignore
  _addHandlerCollapseExpandOrAccordion() {
    this._all(this._accordions).forEach((accordion) => {
      accordion.header.addEventListener("click", this._collapseOrExpandAccordion.bind(this));
    });
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
    this._btnPaste.addEventListener("click", () => {
      handler();
      this.updateTextInputsLength();
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

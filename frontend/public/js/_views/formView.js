import View from "./View.js";

export default class FormView extends View {
  // Inputs keys
  #FIELDS = "all-fields";
  #CHECKBOXES = "all-checkboxes";
  #SELECTS = "all-selects";
  #TEXTAREAS = "all-textareas";

  // Generic key
  #ALL = "*";

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

    // Function for all inputs or all accordions
    this._all = (elements) => elements.get(this.#ALL);

    // Initialize default handlers
    this.updateTextInputsLength();
    this._addHandlerTextInputMaxLength();
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

        const maxLengthEl = input.parentElement.querySelector(".max-length-text");
        if(maxLengthEl) maxLengthEl.textContent = input.getAttribute("maxlength");
      }
    });
    return maxLengthInputs;
  }

  // Form clone (To be referenced whenever there are changes in the form)
  newClone(isDeep = true) {
    return this._form.cloneNode(isDeep);
  }

  // prettier-ignore
  // Make clone select elements equal to state select elements. (A default clone does not apply this).
  #deepSnapshot(clone, state) {
    const cloneSelects = clone.get(this.#SELECTS);
    const stateSelects = state.get(this.#SELECTS);
    stateSelects.forEach((stateSelect, i) => {
      const cloneSelect = cloneSelects.get(i);

      if (cloneSelect.name === stateSelect.name) {
        if (cloneSelect.hasAttribute("multiple") && stateSelect.hasAttribute("multiple")) {
          const cloneOptions = [...cloneSelect.options];
          
          cloneOptions.forEach((option, j) => {
            const stateOption = stateSelect.options[j];
            const isSameValue = option.value === stateOption.value;

            if (isSameValue)
              option.selected = stateOption.selected
          });
        } else cloneSelect.selectedIndex = stateSelect.selectedIndex;
      }
    });
    return clone;
  }

  // Take a snapshot of the form by cloning the form elements
  takeSnapshot(snapshot) {
    snapshot = snapshot ? snapshot : this.newClone(true);

    // State of the form inputs
    const state = this._inputs;

    // Clone of the form inputs
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
  updateTextInputsLength() {
    this._maxLengthInputs.forEach((container, input) => {
      const currentLengthElement = container.querySelector(`#${input.id}-length`);
      if (currentLengthElement) currentLengthElement.textContent = input.value.length;
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
}

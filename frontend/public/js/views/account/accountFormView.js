import FormView from "../formView.js";

export class AccountFormView extends FormView {
  // Accordions keys
  #USER = "user-profile-accordion";
  #defaultProfilePicturePath = "/img/default_profile_picture.jpg";

  // Generic key
  #ALL = "*";

  // prettier-ignore
  constructor(tabElement, formElement) {
    super(tabElement, formElement);

    // Initialize accordions
    this._accordions = this.initalizeAllAccordions();
    this._userAccordion = this._accordions.get(this.#USER);

    // Tags

    this._profilePictureURL = this._fields.get("profile-picture-url");
    this._imgProfilePicture = this._form.querySelector(".form-profile-picture");


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
    this._expandAllAccordions();
    this._addHandlerCollapseExpandOrAccordion();
  }

  // prettier-ignore
  initalizeAllAccordions() {
    const accordionElements = [...this._form.querySelectorAll(".form-grouping-accordion")];
    const mapKey = (i) => i === 0 ? this.#USER : i;
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

  render(user) {
    console.log(user);
    this._tab.firstElementChild.textContent = user.fullName;
    this._tab.firstElementChild.setAttribute("href", `#${user.id}`);

    const fields = this._fields;
    const selects = this._selects;

    fields.get("full-name").value = user.fullName;
    fields.get("initials").value = user.initials;
    fields.get("email").value = user.email;
    fields.get("username").value = user.username;
    fields.get("profile-picture-url").value = user.profilePictureURL;
    selects.get("role").value = user.role;
    selects.get("status").value = user.isEnabled ? "1" : "0";
    selects.get("status").value = user.isEnabled ? "1" : "0";

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Take a new snapshot (Will help detecting changes in the form)
    this._snapshot = this.takeSnapshot();

    // Update form profile picture
    if (user.profilePictureURL)
      this._imgProfilePicture.src = user.profilePictureURL;
    else this._imgProfilePicture.src = this.#defaultProfilePicturePath;

    this._all(this._accordions).forEach((accordion) =>
      this._expandAccordion(accordion.header, accordion.content)
    );
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

  _addHandlerUpdateProfilePicture() {
    this._profilePictureURL.addEventListener("change", () => {
      if (this._profilePictureURL.value === "")
        this._imgProfilePicture.src = this.#defaultProfilePicturePath;
      else this._imgProfilePicture.src = this._profilePictureURL.value;
    });
  }

  // prettier-ignore
  _addHandlerCollapseExpandOrAccordion() {
    this._all(this._accordions).forEach((accordion) => {
      accordion.header.addEventListener("click", this._collapseOrExpandAccordion.bind(this));
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
}

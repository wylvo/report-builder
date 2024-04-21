import FormView from "../../_views/formView.js";

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

    // Id tag
    this._idTag = this._form.querySelector(".tag")

    this._profilePictureURL = this._fields.get("profile-picture-uri");
    this._imgProfilePicture = this._form.querySelector(".form-profile-picture");


    // Initialize default handlers & expand accordions
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
    // prettier-ignore
    const tabTitle = `[${user.role.toUpperCase()}] - ${user.fullName} (${user.email})`;
    this._tab.firstElementChild.textContent = tabTitle;
    this._tab.firstElementChild.setAttribute("href", `#${user.id}`);
    this._idTag.textContent = user.id;

    this._inputs.get(this.#ALL).forEach((input) => {
      input.setAttribute("readonly", "");
    });
    const fields = this._fields;

    fields.get("full-name").value = user.fullName;
    fields.get("initials").value = user.initials;
    fields.get("email").value = user.email;
    fields.get("username").value = user.username;
    fields.get("role").value = user.role;
    fields.get("status").value = user.isEnabled ? "Enabled" : "Disabled";

    // Update input length text indicator (only the ones with "maxlength" attribute)
    this.updateTextInputsLength();

    // Update form profile picture
    if (user.profilePictureURI)
      this._imgProfilePicture.src = user.profilePictureURI;
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
}

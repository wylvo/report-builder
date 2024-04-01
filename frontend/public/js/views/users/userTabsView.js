import TabsView from "../tabsView.js";
import { UserFormView } from "./userFormView.js";

class UserTabsView extends TabsView {
  constructor() {
    super(UserFormView);
  }

  _generateTabHtml(index) {
    const attribute = index === 0 ? `aria-selected="true"` : `tabindex="0"`;
    return `
      <li role="presentation"><a class="tab-btn" id="tab_${index}" href="#" role="tab" ${attribute}></a></li>
    `;
  }

  _generateFormHtml(index) {
    const hidden = index !== 0 ? "hidden" : "";
    return `
      <form class="form" id="form_${index}" role="tabpanel" tabindex="0" ${hidden}>
        <div class="form-header">
          <div>
            <h1>User Profile Card</h1>
          </div>
          <div class="form-action-btns">
            <button type="button" class="form-copy-btn tooltip" id="form-copy-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-copy"></use>
              </svg>
              <span class="tooltiptext">Copy User</span>
            </button>
            <button disabled type="button" class="form-paste-btn tooltip" id="form-paste-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-paste"></use>
              </svg>
              <span class="tooltiptext">Paste User</span>
            </button>
            <button type="button" class="form-new-btn tooltip" id="form-new-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-add"></use>
              </svg>
              <span class="tooltiptext">New User</span>
              <span>NEW</span>
            </button>
          </div>
        </div>
        <div class="form-meta-data">
          <div class="user-tags">
            <p class="user-procedural tag">PROCEDURAL</p>
            <p class="user-oncall tag">ON-CALL</p>
          </div>
          <div>
            <p class="user-id tag"></p>
          </div>
        </div>

        <!-- USER PROFILE -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-user"></use>
              </svg>
              <span>&#8226;</span>
              <h2>User Profile</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <!-- FULL NAME, EMAIL -->
          <div class="form-grouping-content">
            <div class="grid columns-50-50 mt-36">
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="full-name_${index}"
                  name="full-name"
                  class="full-name"
                  required
                  placeholder="John Doe"

                />
                <label for="full-name_${index}">Full Name:</label>
              </div>
              <div class="form-grouping-col">
                <input 
                  type="email"
                  id="email_${index}"
                  name="email"
                  class="email"
                  placeholder="username@bestseller.com"
                  required
                />
                <label for="email_${index}">Email:</label>
              </div>

              <!-- ROLE, STATUS  -->
              <div class="form-grouping-col">
                <select id="role_${index}" name="role" class="role">
                  <option selected value="user">User</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
                <label for="role_${index}">Role:</label>
              </div>

              <div class="form-grouping-col">
                <select id="status_${index}" name="status" class="status">
                  <option selected value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <label for="status_${index}">Status:</label>
              </div>
              
              <!-- <div class="form-grouping-col">
                <input
                  type="tel"
                  id="phone-number_${index}"
                  name="phone-number"
                  class="phone-number"
                  placeholder="(123) 456-7890"
                  value=""
                  maxlength="15"
                />
                <label for="phone-number_${index}">Phone #:</label>
              </div> -->
            </div>
          </div>
        </div>

        <!-- USER PASSWORD -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-lock-closed"></use>
              </svg>
              <span>&#8226;</span>
              <h2>User Password</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <!-- PASSWORD, PASSWORD CONFORMATION -->
          <div class="form-grouping-content">
            <div class="grid columns-50-50 mt-36">
              <div class="form-grouping-col">
                <input
                  type="password"
                  id="password_${index}"
                  name="password"
                  class="password"
                  placeholder="Password"
                  required
                />
                <label for="password_${index}">Password:</label>
              </div>

              <div class="form-grouping-col">
                <input
                  type="password"
                  id="password-confirmation_${index}"
                  name="password-confirmation"
                  class="password-confirmation"
                  placeholder="Password Confirmation"
                  required
                />
                <label for="password-confirmation_${index}">Password Confirmation:</label>
              </div>
              
            </div>
          </div>
        </div>

        <!-- CALL TO ACTION BUTTONS -->
        <div class="grid columns-50-50 form-buttons">
          <label for="form-submit-btn_${index}" class="cta-button">
            <button
              type="submit"
              id="form-submit-btn_${index}"
              class="form-submit-btn"
            >
              <svg class="icons">
                <use href="/img/icons.svg#icon-save"></use>
              </svg>
              <p class="form-submit-btn-text" id="form-submit-btn-text_${index}">Create User</p>
            </button>
          </label>
        </div>
      </form>
    `;
  }

  // Cancel the event and show an alert that the unsaved changes would be lost
  addHandlerBeforeUnload(handler) {
    window.addEventListener("beforeunload", function (e) {
      if (handler()) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }
}

export default new UserTabsView();

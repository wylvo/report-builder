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
          <div class="report-tags">
            <p class="user-status tag">PROCEDURAL</p>
            <p class="user-role tag">ON-CALL</p>
          </div>
          <div>
            <p class="data-id tag"></p>
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

          <div class="form-grouping-content">
            
          <!-- PROFILE PICTURE -->
            <img class="form-profile-picture mt-36" src="/img/default_profile_picture.jpg" alt="Profile picture" />
            <div class="grid columns-50-50">

              <!-- FULL NAME, INITIALS -->
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
                  type="text"
                  id="initials_${index}"
                  name="initials"
                  class="initials"
                  maxlength="2"
                  placeholder="JD"
                />
                <label for="initials_${index}">Initials:</label>
                <p class="max-length"><span id="initials_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>

              <!-- EMAIL, USERNAME -->
              <div class="form-grouping-col">
                <input 
                  type="email"
                  id="email_${index}"
                  name="email"
                  class="email"
                  placeholder="john.doe@bestseller.com"
                  required
                />
                <label for="email_${index}">Email:</label>
              </div>
              <div class="form-grouping-col">
                <input 
                  type="text"
                  id="username_${index}"
                  name="username"
                  class="username"
                  maxlength="20"
                  placeholder="john.doe"
                  required
                />
                <label for="username_${index}">Username:</label>
                <p class="max-length"><span id="username_${index}-length">0</span>/<span class="max-length-text"></span></p>
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
                  <option selected value="1">Enabled</option>
                  <option value="0">Disabled</option>
                </select>
                <label for="status_${index}">Status:</label>
              </div>
            </div>
            
            <!-- PROFILE PICTURE URI -->
            <div class="form-grouping-col ">
              <input
                type="url"
                id="profile-picture-uri_${index}"
                name="profile-picture-uri"
                class="profile-picture-uri"
                placeholder="data:image/png;base64,..."
              />
              <label for="profile-picture-uri_${index}">Profile Picture URI:</label>
            </div>
          </div>
        </div>

        <!-- USER AUTHENTICATION -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-lock-closed"></use>
              </svg>
              <span>&#8226;</span>
              <h2>User Authentication</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <!-- PASSWORD, PASSWORD CONFIRMATION -->
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
                  placeholder="Confirm Password"
                  required
                />
                <label for="password-confirmation_${index}">Confirm Password:</label>
              </div>
            </div>

            <!-- PASSWORD EXPIRATION, ENABLE 2FA -->
            <div class="grid columns-50-50">
              <div class="form-grouping-col">
                <select id="password-expiration_${index}" name="password-expiration" class="password-expiration">
                  <option selected value="0">Password Never Expires</option>
                  <option value="">Every Month</option>
                  <option value="">Every 3 Months</option>
                  <option value="">Every 6 Months</option>
                  <option value="">Every Year</option>
                </select>
                <label for="password-expiration_${index}">Password Expires:</label>
              </div>

              <div class="form-grouping-col self-end">
                <label for="enable-2fa_${index}">Enable 2FA</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="enable-2fa_${index}"
                    name="enable-2fa"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-meta-data">
          <div class="report-tags">
            <p class="user-status tag">PROCEDURAL</p>
            <p class="user-role tag">ON-CALL</p>
          </div>
          <div>
            <p class="data-id tag"></p>
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

          <label for="form-reset-password-btn_${index}" class="cta-button">
            <button
              type="submit"
              id="form-reset-password-btn_${index}"
              class="form-reset-password-btn"
              disabled
            >
              <p class="form-reset-password-btn-text" id="form-reset-password-btn-text_${index}">Reset User Password</p>
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

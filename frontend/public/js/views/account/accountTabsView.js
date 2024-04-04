import TabsView from "../tabsView.js";
import { AccountFormView } from "./accountFormView.js";

class AccountTabsView extends TabsView {
  constructor() {
    super(AccountFormView);
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
                  type="username"
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
            
            <!-- PROFILE PICTURE URL -->
            <div class="form-grouping-col ">
              <input
                type="url"
                id="profile-picture-url_${index}"
                name="profile-picture-url"
                class="profile-picture-url"
                placeholder="Image URL"
              />
              <label for="profile-picture-url_${index}">Profile Picture URL:</label>
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

export default new AccountTabsView();

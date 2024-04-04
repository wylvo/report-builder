import TabsView from "../tabsView.js";
import { AccountFormView } from "./accountFormView.js";

class AccountTabsView extends TabsView {
  constructor() {
    super(AccountFormView);
  }

  _generateTabHtml(index) {
    const attribute = index === 0 ? `aria-selected="true"` : `tabindex="0"`;
    return `
      <li role="presentation"><a class="tab-btn" id="tab_${index}" href="#" role="tab" ${attribute}>Your Account</a></li>
    `;
  }

  _generateFormHtml(index) {
    const hidden = index !== 0 ? "hidden" : "";
    return `
      <form class="form" id="form_${index}" role="tabpanel" tabindex="0" ${hidden}>
        <div class="form-meta-data">
          <div>
            <p>User ID:<span class="data-id tag"></span></p>
          </div>
        </div>

        <!-- USER PROFILE -->
        <div class="form-grouping mb-36">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-user"></use>
              </svg>
              <span>&#8226;</span>
              <h2>Your Account Details</h2>
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
                  placeholder="Your Full Name"
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
                  placeholder="Your Initials"
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
                  placeholder="Your Email"
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
                  placeholder="Your Username"
                />
                <label for="username_${index}">Username:</label>
                <p class="max-length"><span id="username_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>

              <!-- ROLE, STATUS  -->
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="role_${index}"
                  name="role"
                  class="role"
                  placeholder="Your Role"
                />
                <label for="role_${index}">Role:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="status_${index}"
                  name="status"
                  class="status"
                  placeholder="Your Status"
                />
                <label for="status_${index}">Status:</label>
              </div>
              
            </div>
            
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

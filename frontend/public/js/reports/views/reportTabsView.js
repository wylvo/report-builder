import TabsView from "../../_views/tabsView.js";
import { ReportFormView } from "./reportFormView.js";

class ReportTabsView extends TabsView {
  constructor() {
    super(ReportFormView);
  }

  _generateTabHtml(index) {
    const attribute = index === 0 ? `aria-selected="true"` : `tabindex="0"`;
    return `
      <li role="presentation"><a class="tab-btn" id="tab_${index}" href="#" role="tab" ${attribute}></a></li>
    `;
  }

  _generateFormHtml(formDataSelects, index) {
    const hidden = index !== 0 ? "hidden" : "";
    return `
      <form class="form" id="form_${index}" role="tabpanel" tabindex="0" ${hidden}>
        <div class="form-header">
          <div class="form-header-info">
            <h1>Phone Call Report</h1>
            <div class="hidden report-info tooltip">
              <svg class="icons">
                <use href="/img/icons.svg#icon-info"></use>
              </svg>
              <div class="tooltiptext auto">
              </div>
            </div>
          </div>
          <div class="form-action-btns">
            <button type="button" class="hidden form-btn transfer tooltip" id="form-transfer-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-transfer"></use>
              </svg>
              <span class="tooltiptext">Transfer Report</span>
            </button>          
            <button type="button" class="form-btn copy tooltip" id="form-copy-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-copy"></use>
              </svg>
              <span class="tooltiptext">Copy Report</span>
            </button>
            <button disabled type="button" class="form-btn paste tooltip" id="form-paste-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-paste"></use>
              </svg>
              <span class="tooltiptext">Paste Report</span>
            </button>
            <button type="button" class="form-btn new tooltip" id="form-new-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-add"></use>
              </svg>
              <span class="tooltiptext">New Report</span>
              <span>NEW</span>
            </button>
          </div>
        </div>
        <div class="form-meta-data">
          <div class="report-tags">
            <p class="report-deleted tag">DELETED</p>
            <p class="report-procedural tag">PROCEDURAL</p>
            <p class="report-oncall tag">ON-CALL</p>
          </div>
          <div>
            <p>Report ID:<span class="data-id tag"></span></p>
          </div>
        </div>

        <!-- PHONE CALL -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-phone-call"></use>
              </svg>
              <span>&#8226;</span>
              <h2>Phone Call</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <!-- PHONE CALL DATE, PHONE CALL TIME, BUTTON NOW -->
          <div class="form-grouping-content">
            <div class="grid columns-50-50 mt-36">
              <div class="form-grouping-col">
                <input type="date" id="date_${index}" name="date" class="date" required />
                <label for="date_${index}">Date:</label>
              </div>
              <div class="form-grouping-col now-btn">
                <input type="time" id="time_${index}" name="time" class="time" required />
                <label for="time_${index}">Time:</label>
                <button type="button" id="form-now-btn_${index}" class="form-btn now">
                  NOW
                </button>
              </div>

              <!-- STATUS, PHONE NUMBER, PHONE NO CALLER ID  -->
              <div class="form-grouping-col">
                <select 
                  id="status_${index}" 
                  name="status" 
                  class="status" 
                  required
                >
                  ${formDataSelects.statuses.join("")}
                </select>
                <label for="status_${index}">Status:</label>
              </div>
              <div class="form-grouping-row columns-2">
                <div class="form-grouping-col">
                  <input
                    type="tel"
                    id="phone-number_${index}"
                    name="phone-number"
                    class="phone-number"
                    placeholder="(123) 456-7890"
                    value=""
                    maxlength="20"
                  />
                  <label for="phone-number_${index}">Phone Number:</label>
                </div>
                <div class="form-grouping-col self-end">
                  <label for="phone-no-caller-id_${index}">No Caller ID</label>
                  <label class="switch">
                    <input
                      type="checkbox"
                      id="phone-no-caller-id_${index}"
                      name="phone-no-caller-id"
                      class="phone-no-caller-id"
                    />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STORE INFORMATION -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-storefront"></use>
              </svg>
              <span>&#8226;</span>
              <h2>Store Information</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <!-- STORE NUMBERS -->
          <div class="form-grouping-content">
            <div class="grid mt-36">
              <div class="form-grouping-col gc-span-2-switch">
                <select
                  multiple
                  multiselect-search="true" 
                  multiselect-select-all="true" 
                  multiselect-max-items="25"
                  multiselect-hide-x = "false"                
                  id="store-numbers_${index}" 
                  name="store-numbers" 
                  class="store-numbers" 
                  required
                >
                  ${formDataSelects.storeNumbers.join("")}
                </select>
                <label for="store-numbers_${index}">Store Numbers:</label>
              </div>
            </div>

            <!-- STORE EMPLOYEE, STORE MANAGER -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2">
                <input
                  type="text"
                  id="store-employee_${index}"
                  name="store-employee"
                  class="store-employee"
                  placeholder="John Doe"
                  maxlength="100"
                />
                <label for="store-employee_${index}">Employee Name:</label>
                <p class="max-length"><span id="store-employee_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
              <div class="form-grouping-col gc-3 self-end">
                <label for="store-manager_${index}">Store Manager</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="store-manager_${index}"
                    name="store-manager"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- STORE DISTRICT MANAGERS -->
            <div class="grid">
              <div class="form-grouping-col gc-span-2">
                <p>District Managers:</p>
                <div class="district-managers">
                  <div class="dm">
                    <img class="dm-profile-picture" alt="District manager profile picture" src="/img/default_profile_picture.jpg"/>
                    <p>None</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INCIDENT DETAILS -->
        <div class="form-grouping">
          <div class="form-grouping-accordion">
            <div class="form-grouping-accordion-header">
              <svg class="icons">
                <use href="/img/icons.svg#icon-reader"></use>
              </svg>
              <span>&#8226;</span>
              <h2>Incident Details</h2>
            </div>
            <button type="button">
              <svg class="icons icon-chevron">
                <use href="/img/icons.svg#icon-chevron-up"></use>
              </svg>
            </button>
          </div>

          <div class="form-grouping-content">
            <!-- INCIDENT TITLE -->
            <div class="grid mt-36">
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="incident-title_${index}"
                  name="incident-title"
                  class="incident-title"
                  placeholder="e.g.: JJ101 Transaction Error..."
                  maxlength="100"
                  required
                />
                <label for="incident-title_${index}">Title:</label>
                <p class="max-length"><span id="incident-title_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
            </div>

            <!-- INCIDENT TYPES, INCIDENT PROCEDURAL  -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2">
                <select
                  multiple
                  multiselect-search="true" 
                  multiselect-select-all="true" 
                  multiselect-max-items="5"
                  multiselect-hide-x = "false"                
                  id="incident-types_${index}"
                  name="incident-types"
                  class="incident-types"
                  required
                >
                  ${formDataSelects.incidentTypes.join("")}
                </select>
                <label for="incident-types_${index}">Incident Types:</label>
              </div>
              
              <div class="form-grouping-col gc-3 self-end">
                <label for="incident-procedural_${index}">Procedural</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="incident-procedural_${index}"
                    name="incident-procedural"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- INCIDENT POS NUMBER, INCIDENT ERROR CODE, TRRANSACTION ISSUE -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2-switch">
                <select
                  id="incident-pos-number_${index}"
                  name="incident-pos-number"
                  class="incident-pos-number"
                >
                  ${formDataSelects.pos.join("")}
                </select>
                <label for="incident-pos-number_${index}">POS Number:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="incident-error-code_${index}"
                  name="incident-error-code"
                  class="incident-error-code"
                  maxlength="100"
                  placeholder="From Hardware, Software bugs"
                />
                <label for="incident-error-code_${index}">Error Code:</label>
                <p class="max-length"><span id="incident-error-code_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
              <div class="form-grouping-col self-end">
                <label for="incident-variance-report_${index}"
                  >Variance Report</label
                >
                <label class="switch">
                  <input
                    type="checkbox"
                    id="incident-variance-report_${index}"
                    name="incident-variance-report"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- TRANSACTION TYPES, TRANSACTION NUMBER, TRANSACTION INCIDENT REPORT -->
            <div class="grid columns-37-37-25 transaction-details">
              <div class="form-grouping-col gc-span-2-switch">
                <select
                  multiple
                  multiselect-search="true" 
                  multiselect-select-all="true" 
                  multiselect-max-items="5"
                  multiselect-hide-x = "false"
                  id="transaction-types_${index}"
                  name="transaction-types"
                  class="transaction-types"
                >
                  ${formDataSelects.incidentTransactionTypes.join("")}
                </select>
                <label for="transaction-types_${index}">Transaction Types:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="transaction-number_${index}"
                  name="transaction-number"
                  class="transaction-number"
                  placeholder="1010203772"
                  maxlength="100"
                />
                <label for="transaction-number_${index}">Transaction Number:</label>
                <p class="max-length"><span id="transaction-number_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
              <div class="form-grouping-col self-end">
                <label for="transaction-issue_${index}">Transaction</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="transaction-issue_${index}"
                    name="transaction-issue"
                    class="transaction-issue"
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- INCIDENT DETAILS -->
            <div class="form-grouping-col">
              <textarea
                id="incident-details_${index}"
                name="incident-details"
                class="incident-details"
                placeholder="What happened during this incident, actions taken, etc..."
                maxlength="2000"
                required
              ></textarea>
              <label for="incident-details_${index}">Details:</label>
              <p class="max-length"><span id="incident-details_${index}-length">0</span>/<span class="max-length-text"></span></p>
            </div>

            <!-- ASSIGNED TO SIGNATURE, ON-CALL -->
            <div class="form-grouping-row">
              <div class="form-grouping-col">
                <select
                  id="assigned-to_${index}"
                  name="assigned-to"
                  class="assigned-to"
                  required
                >
                  ${formDataSelects.users.join("")}
                </select>
                <label for="assigned-to_${index}">Assigned To:</label>
              </div>
              <div class="form-grouping-col">
                <label for="oncall_${index}">On-call</label>
                <label class="switch">
                  <input type="checkbox" id="oncall_${index}" name="oncall" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="form-meta-data">
          <div class="report-tags">
            <p class="report-deleted tag">DELETED</p>
            <p class="report-procedural tag">PROCEDURAL</p>
            <p class="report-oncall tag">ON-CALL</p>
          </div>
          <div>
            <p>Report ID:<span class="data-id tag"></span></p>
          </div>
        </div>

        <!-- CALL TO ACTION BUTTONS -->
        <div class="grid columns-50-50 form-buttons">
          <label for="form-submit-btn_${index}">
            <button
              type="submit"
              id="form-submit-btn_${index}"
              class="form-btn submit"
            >
              <svg class="icons">
                <use href="/img/icons.svg#icon-save"></use>
              </svg>
              <p class="form-submit-btn-text" id="form-submit-btn-text_${index}">Create Report</p>
            </button>
          </label>

          <label for="form-teams-btn_${index}">
            <button
              type="button"
              id="form-teams-btn_${index}"
              class="form-btn ms-teams"
              disabled
            >
              <svg class="icons">
                <use href="/img/icons.svg#icon-ms-teams"></use>
              </svg>
              <p class="form-teams-btn-text">Teams Channel</p>
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

export default new ReportTabsView();

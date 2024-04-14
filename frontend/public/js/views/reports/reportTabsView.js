import TabsView from "../tabsView.js";
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

  _generateFormHtml(index) {
    const hidden = index !== 0 ? "hidden" : "";
    return `
      <form class="form" id="form_${index}" role="tabpanel" tabindex="0" ${hidden}>
        <div class="form-header">
          <div>
            <h1>Phone Call Report</h1>
          </div>
          <div class="form-action-btns">
            <button type="button" class="form-copy-btn tooltip" id="form-copy-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-copy"></use>
              </svg>
              <span class="tooltiptext">Copy Report</span>
            </button>
            <button disabled type="button" class="form-paste-btn tooltip" id="form-paste-btn_${index}">
              <svg class="icons">
                <use href="/img/icons.svg#icon-paste"></use>
              </svg>
              <span class="tooltiptext">Paste Report</span>
            </button>
            <button type="button" class="form-new-btn tooltip" id="form-new-btn_${index}">
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
            <p class="report-procedural tag">PROCEDURAL</p>
            <p class="report-oncall tag">ON-CALL</p>
          </div>
          <div>
            <p class="data-id tag"></p>
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
                <button type="button" id="form-now-btn_${index}" class="form-now-btn">
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
                  <option selected value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
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
                    maxlength="15"
                  />
                  <label for="phone-number_${index}">Phone #:</label>
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

          <!-- STORE NUMBER, STORE EMPLOYEE, STORE MANAGER -->
          <div class="form-grouping-content">
            <div class="grid columns-37-37-25 mt-36">
              <div class="form-grouping-col gc-span-2-switch">
                <input
                  type="number"
                  id="store-number_${index}"
                  name="store-number"
                  class="store-number"
                  placeholder="101"
                  min="101"
                  max="710"
                  required
                />
                <label for="store-number_${index}">Number:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="store-employee_${index}"
                  name="store-employee"
                  class="store-employee"
                  placeholder="John Doe"
                  maxlength="50"
                />
                <label for="store-employee_${index}">Employee Name:</label>
                <p class="max-length"><span id="store-employee_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
              <div class="form-grouping-col self-end">
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

            <!-- STORE DISTRICT MANAGER, DM CONTACTED -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2">
                <select 
                  id="store-dm_${index}" 
                  name="store-dm" 
                  class="store-dm"
                  required
                >
                  <option value="carolane.brisebois">Carolane Brisebois</option>
                  <option value="isabelle.hamel">Isabelle Hamel</option>
                  <option value="david.yon">David Yon</option>
                  <option value="julian.pedis">Julian Pedis (No more DM)</option>
                  <option value="louis-philippe.dalpe">Louis-Philippe Dalpe (No more DM)</option>
                  <option value="">(None)</option>
                </select>
                <label for="store-dm_${index}">Distric Manager:</label>
              </div>
              <div class="form-grouping-col gc-3 self-end">
                <label for="store-dm-contacted_${index}">DM Contacted</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="store-dm-contacted_${index}"
                    name="store-dm-contacted"
                  />
                  <span class="slider"></span>
                </label>
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

            <!-- INCIDENT DATE, INCIDENT TIME, SAME TIME -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col">
                <input
                  type="date"
                  id="incident-date_${index}"
                  name="incident-date"
                  class="incident-date"
                  required
                />
                <label for="incident-date_${index}">Date:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="time"
                  id="incident-time_${index}"
                  name="incident-time"
                  class="incident-time"
                  required
                />
                <label for="incident-time_${index}">Time:</label>
              </div>

              <div class="form-grouping-col self-end">
                <label for="copy-timestamp_${index}">Same Time</label>
                <label class="switch">
                  <input
                    type="checkbox"
                    id="copy-timestamp_${index}"
                    name="copy-timestamp"
                    class="copy-timestamp"
                    checked
                  />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- INCIDENT TYPE, INCIDENT POS NUMBER, INCIDENT PROCEDURAL  -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2-switch">
                <select
                  id="incident-type_${index}"
                  name="incident-type"
                  class="incident-type"
                  required
                >
                  <option value="Bug">Bug</option>
                  <option value="Update">Update</option>
                  <option value="Outage">Outage</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Networking">Networking</option>
                  <option value="Authentication">Authentication</option>
                  <option value="Employee Mistake">
                    Employee Mistake
                  </option>
                  <option value="Other">Other (Non TECH)</option>
                </select>
                <label for="incident-type_${index}">Incident Type:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="number"
                  id="incident-pos-number_${index}"
                  name="incident-pos-number"
                  class="incident-pos-number"
                  placeholder="1"
                  min="1"
                  max="3"
                />
                <label for="incident-pos-number_${index}">POS #:</label>
              </div>
              <div class="form-grouping-col self-end">
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

            <!-- INCIDENT ERROR CODE, TRRANSACTION ISSUE -->
            <div class="grid columns-37-37-25">
              <div class="form-grouping-col gc-span-2">
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
              <div class="form-grouping-col gc-3 self-end">
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

            <!-- TRANSACTION TYPE, TRANSACTION NUMBER, TRANSACTION INCIDENT REPORT -->
            <div class="grid columns-37-37-25 transaction-details">
              <div class="form-grouping-col gc-span-2-switch">
                <select
                  id="transaction-type_${index}"
                  name="transaction-type"
                  class="transaction-type"
                >
                  <option value="Sale">Sale</option>
                  <option value="Refund">Refund</option>
                  <option value="Variance">Variance</option>
                  <option value="Exchange">Exchange</option>
                  <option value="Correction">Correction</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Employee Sale">Employee Sale</option>
                  <option value="Other">Other (Fraud)</option>
                </select>
                <label for="transaction-type_${index}">Transaction Type:</label>
              </div>
              <div class="form-grouping-col">
                <input
                  type="text"
                  id="transaction-number_${index}"
                  name="transaction-number"
                  class="transaction-number"
                  placeholder="1010203772"
                  maxlength="50"
                />
                <label for="transaction-number_${index}">Transaction #:</label>
                <p class="max-length"><span id="transaction-number_${index}-length">0</span>/<span class="max-length-text"></span></p>
              </div>
              <div class="form-grouping-col self-end">
                <label for="transaction-incident-report_${index}"
                  >Inc. Report</label
                >
                <label class="switch">
                  <input
                    type="checkbox"
                    id="transaction-incident-report_${index}"
                    name="transaction-incident-report"
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

            <!-- TECH SIGNATURE, ON-CALL -->
            <div class="form-grouping-row">
              <div class="form-grouping-col">
                <select
                  id="tech-employee_${index}"
                  name="tech-employee"
                  class="tech-employee"
                  required
                >
                  <option selected value="william.evora">William Evora</option>
                  <option value="carah.malcolm">Carah Malcolm</option>
                </select>
                <label for="tech-employee_${index}">TECH Signature:</label>
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
            <p class="report-procedural tag">PROCEDURAL</p>
            <p class="report-oncall tag">ON-CALL</p>
          </div>
          <div>
            <p class="report-id tag"></p>
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
              <p class="form-submit-btn-text" id="form-submit-btn-text_${index}">Create Report</p>
            </button>
          </label>

          <label for="form-teams-btn_${index}" class="cta-button">
            <button
              type="button"
              id="form-teams-btn_${index}"
              class="form-teams-btn"
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

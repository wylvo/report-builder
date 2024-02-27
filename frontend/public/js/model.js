import { DEFAULT_REPORT } from "./config.js";
import { migrateReportData } from "./migrate.js";

export const migrateReport = migrateReportData;
export const state = {
  version: null,
  theme: "light",
  rowsPerPage: null,
  reports: [],
  search: {
    query: "",
    filterBy: "",
    results: [],
    page: 1,
  },
  tab: 0,
  tabs: new Map(),
  clipboard: new Map(),
};

// Sleep/Wait and do nothing
export const sleep = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// prettier-ignore
// https://stackoverflow.com/questions/722668/traverse-all-the-nodes-of-a-json-object-tree-with-javascript#answer-722732
const traverse = (func, defaultObject, targetObject, currentObject = undefined) => {
  for (const key in defaultObject) {
    func.apply(this, [defaultObject, targetObject, key, currentObject]);

    if (Object.hasOwn(defaultObject, key) && typeof defaultObject[key] === "object") {
      traverse(func, defaultObject[key], targetObject[key], key);
    }
  }
};

// Freeze objects recursively (freeze nested objects)
const deepFreeze = (object) => {
  object = Object.freeze(object);
  for (const key in object) {
    if (Object.hasOwn(object, key) && typeof object[key] === "object") {
      if (!Object.isFrozen(object[key])) deepFreeze(object[key]);
    }
  }
};

// JSON Fetch requests
const fetchJSON = async (url, jsonData = undefined) => {
  try {
    const response = jsonData
      ? await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(jsonData),
        })
      : await fetch(url);

    const data = await response.json();

    if (!response.ok)
      throw new Error(
        `Request failed with status code ${response.status} (${response.statusText}).`
      );
    return { response, data };
  } catch (error) {
    throw error;
  }
};

// Get app version from package.json
export const appVersion = async function () {
  return (state.version = (await fetchJSON("/api/version")).data.version);
};

// Send Teams webhook data to local server. Local server will send webhook & handle webhook response
export const sendTeamsWebhook = async function (report) {
  return await fetchJSON("/api/send", report);
};

// Send a copy of reports to local server. Local server will write reports into a JSON file for backup
export const sendBackupReports = async function (reports) {
  return await fetchJSON("/api/backup", reports);
};

// Generate UUID version 4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toLowerCase();
  });
};

// Format date to MM/DD/YYYY HH:mm AM or PM
export const formatDate = (date) => {
  date = new Date(date);
  if (isNaN(date)) return null;

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let amPM = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;

  // prettier-ignore
  return {
    iso: date.toISOString(),
    sharepoint: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hours}:${minutes} ${amPM}`,
  };
};

// Find report index by ID
// prettier-ignore
const findReportIndex = (targetReport) => {
  const index = state.reports.findIndex((report) =>
    report.id === (typeof targetReport === "object" ? targetReport.id : targetReport));
  if(index === -1)
    throw new TypeError(`Invalid target. Report index is undefined.`);
  return index;
}

// Find report by ID
export const findReportById = (id) => {
  const report = state.reports.find((report) => report.id === id);
  if (typeof report === "undefined")
    throw new TypeError(`Invalid id "${id}". Report is undefined.`);
  return report;
};

// Load report into a tab
export const loadReport = function (tabIndex, id) {
  const tab = findTab(tabIndex);
  tab.report = findReportById(id);
  return tab.report;
};

// Check validity of a report by looking at data types
export const checkValidity = (report) => {
  const missingKeys = [];
  const invalidTypes = [];

  // prettier-ignore
  const hasSameValueTypes = (defaultObject, targetObject, key, currentObject) => {
    const target = typeof currentObject === "undefined" ? "root" : currentObject;

    // If the target object does not exist, throw an error. (For nested objects)
    if (typeof targetObject === "undefined") throw new Error(`Failed to create report. The "${target}" object was not found.`)

    // Key Names. Sort by alphabetical order to compare them
    const defaultKeys = Object.keys(defaultObject).sort();
    const reportKeys = Object.keys(targetObject).sort();

    // If the given number keys inside the default object !== the number keys inside the target object (report)
    if (defaultKeys.length !== reportKeys.length) {

      // And if the target (report) object has no transaction data stop the iteration by returning nothing
      if (target === "transaction" && !Object.hasOwn(targetObject, key)) return;

      // Else throw an error if none of the condition were met. In this case, it means that the 2 objects have different lengths.
      throw new Error(`Failed to create a report object. The number of keys found inside the "${target}" object is invalid.`);
    }

    // Key Values
    const defaultKeyValue = defaultObject[key];
    const targetKeyValue = targetObject[key];

    // If the target (report) object key value does not exist
    if (typeof targetKeyValue === "undefined") {

      // Keep it in memory, and return nothing to stop the iteration.
      return missingKeys.push(key);
    }

    // If the default object key value types !== the target (report) object key value types
    if (typeof defaultKeyValue !== typeof targetKeyValue) {

      // if keys "lastModifiedDateTime" & "updatedBy" are null stop the iteration by returning nothing. "lastModifiedDateTime" & "updatedBy" can === null.
      if(key === "lastModifiedDateTime" || key === "updatedBy") {
        if (targetKeyValue === null || typeof targetKeyValue === "string") return;

        // Else keep it in memory, and return nothing to stop the iteration.
        return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
      }

      // Else keep it in memory, and return nothing to stop the iteration.
      return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
    }

    // If keys are "dateTime", "createdDateTime" & "lastModifiedDateTime".
    if(key.toLowerCase().includes("datetime")) {
      const date = new Date(targetObject[key]);

      // If it is a invalid date, keep it in memory, and return nothing to stop the iteration.
      if (isNaN(date)) {
        return invalidTypes.push({ key: key, type: "date object: string", target: target });
      } 
    }
  };

  // Traverse default report object, and compare data types with report object passed in parameter
  traverse(hasSameValueTypes, DEFAULT_REPORT, report);

  const hasMissingKeys = missingKeys.length > 0;
  const hasinvalidTypes = invalidTypes.length > 0;

  // prettier-ignore
  // Parse errors into a single string message
  if (hasMissingKeys || hasinvalidTypes) {
    throw new Error(
      `Failed to create a report object${
        hasMissingKeys
          ? `. You have ${missingKeys.length} missing key(s) "${missingKeys.join(", ")}"`
          : ""
      }${
        hasinvalidTypes
          ? `. You have ${invalidTypes.length} invalid data type(s). ${invalidTypes.map((el) => 
            `"${el.key}" should be of type "${el.type}" inside the "${el.target}" object`).join(", ")}`
          : ""
      }.`
    );
  }

  const invalidInputLengths = [];

  if (report.call.phone.length > 15) invalidInputLengths.push("phone number");
  if (report.store.employee.name.length > 50)
    invalidInputLengths.push("store employee name");
  if (report.incident.title.length > 100)
    invalidInputLengths.push("incident title");
  if (report.incident.error.length > 100)
    invalidInputLengths.push("incident error code");
  // prettier-ignore
  if (report.incident.transaction.number && report.incident.transaction.number.length > 50)
    invalidInputLengths.push("incident transaction number");
  if (report.incident.details.length > 2000)
    invalidInputLengths.push("incident details");

  const hasInvalidInputLength = invalidInputLengths.length > 0;
  if (hasInvalidInputLength) {
    throw new Error(
      `The following fields have invalid lengths: ${invalidInputLengths.join(
        ", "
      )}.`
    );
  }
};

// prettier-ignore
// Create a single report object
export const createReportObject = function (report, form) {
  return {
    id: report?.id ?? generateUUID(),
    version: state.version,
    createdDateTime: report?.createdTime ?? new Date().toISOString(),
    lastModifiedDateTime: null,
    createdBy:
      report?.createdBy ??
      form["tech-employee"].options[form["tech-employee"].selectedIndex].text.trim(),
    updatedBy: null,
    isDeleted: false,
    isWebhookSent: report?.isWebhookSent ?? false,
    hasTriggeredWebhook: report?.hasTriggeredWebhook ?? false,
    tableRowEl: report?.tableRowEl || {},
    call: {
      date: form.date.value.trim(),
      time: form.time.value.trim(),
      dateTime: formatDate(`${form.date.value.trim()} ${form.time.value.trim()}`).sharepoint,
      phone: form["phone-no-caller-id"].checked
        ? "No Caller ID"
        : form["phone-number"].value.trim(),
      status: form["status"].value.trim(),
    },
    store: {
      number: form["store-number"].value.trim(),
      employee: {
        name: form["store-employee"].value.trim(),
        isStoreManager: form["store-manager"].checked,
      },
      districtManager: {
        name: form["store-dm"].options[form["store-dm"].selectedIndex].text.trim(),
        username: form["store-dm"].value.trim(),
        isContacted: form["store-dm-contacted"].checked,
      },
    },
    incident: {
      title: form["incident-title"].value.trim(),
      date: form["incident-date"].value.trim(),
      time: form["incident-time"].value.trim(),
      dateTime: formatDate(
        `${form["incident-date"].value.trim()} ${form["incident-time"].value.trim()}`
      ).sharepoint,
      copyTimestamp: form["copy-timestamp"].checked,
      type: form["incident-type"].value.trim(),
      pos: form["incident-pos-number"].value.trim(),
      isProcedural: form["incident-procedural"].checked,
      error: form["incident-error-code"].value.trim(),
      transaction: form["transaction-issue"].checked
        ? {
            type: form["transaction-type"].value.trim(),
            number: form["transaction-number"].value.trim(),
            isIRCreated: form["transaction-incident-report"].checked,
          }
        : {},
      details: form["incident-details"].value.trim(),
    },
    tech: {
      name: form["tech-employee"].options[form["tech-employee"].selectedIndex].text.trim(),
      username: form["tech-employee"].value.trim(),
      initials: `${form["tech-employee"].value.trim().split(".")[0][0] + form["tech-employee"].value.trim().split(".")[1][0]}`.toUpperCase(),
      isOnCall: form.oncall.checked,
    },
  };
};

// prettier-ignore
// Update existing report. Update local storage
export const updateReport = function (reportOrId, form) {
  const index = findReportIndex(reportOrId);
  const report = state.reports[index];
  const tableRowEl = report.tableRowEl;
  report.tableRowEl = {};

  // Create a clone of the report to update
  let clone = structuredClone(report);

  // Update the clone separately with new data from the form
  clone = createReportObject(clone, form);
  clone.lastModifiedDateTime = new Date().toISOString();
  clone.updatedBy =
    form["tech-employee"].options[form["tech-employee"].selectedIndex].text.trim();
  clone.isWebhookSent = false;
  clone.isDeleted = false;

  // Check validity of the clone. If not valid, an error will be thrown here.
  checkValidity(clone);

  // Update the report
  report.createdDateTime = clone.createdDateTime;
  report.lastModifiedDateTime = clone.lastModifiedDateTime;
  report.createdBy = clone.createdBy;
  report.updatedBy = clone.updatedBy;
  report.isWebhookSent = clone.isWebhookSent;
  report.isDeleted = clone.isDeleted;
  report.tableRowEl = tableRowEl;
  report.call = clone.call;
  report.store = clone.store;
  report.incident = clone.incident;
  report.tech = clone.tech;

  saveReportsInLocalStorage();
  return report;
};

// Update report key values. Update local storage
// Only "isWebhookSent" and "hasTriggeredWebhook" keys are allowed
const updateReportKeyValue = function (report, key, value) {
  const index = findReportIndex(report);
  if (!Object.hasOwn(state.reports[index], key))
    throw new TypeError(`Could not find key "${key}" in report object.`);

  if (key !== "isWebhookSent" && key !== "hasTriggeredWebhook")
    throw new TypeError(
      `Invalid key "${key}". Only "isWebhookSent" and "hasTriggeredWebhook" keys are allowed.`
    );

  if (typeof value !== "boolean" || value === false)
    throw new TypeError(`Invalid value type. Only boolean allowed.`);

  state.reports[index][key] = value;
  saveReportsInLocalStorage();
  return state.reports[index];
};

// Update report key: "isWebhookSent" to value: true
export const updateIsWebhookSent = function (report) {
  updateReportKeyValue(report, "isWebhookSent", true);
};

// Update report key: "hasTriggeredWebhook" to value: true
export const updateHasTriggeredWebhook = function (report) {
  updateReportKeyValue(report, "hasTriggeredWebhook", true);
};

// New report. Clear report in current tab
export const newReport = function (tabIndex) {
  const tab = findTab(tabIndex);
  tab.report = {};
  return tab.report;
};

// Add a single report. Update local storage. Send a backup of the report
export const addReport = function (report) {
  state.reports.unshift(report);
  saveReportsInLocalStorage();
  sendBackupReports([report]);
  return report;
};

// Remove a single report. Update local storage. Send a backup of the report
export const deleteReport = function (report) {
  report.isDeleted = true;
  report.tableRowEl.remove();

  const index = findReportIndex(report);
  state.reports.splice(index, 1);
  saveReportsInLocalStorage();
  sendBackupReports([report]);
  return report;
};

// Save reports to the local browser storage
export const saveReportsInLocalStorage = function () {
  localStorage.setItem("reportsList", JSON.stringify(state.reports));
};

// Initialize reports from the local browser storage
const initReportsInLocalStorage = function () {
  let reports = JSON.parse(localStorage.getItem("reportsList"));
  if (!reports) (reports = []), saveReportsInLocalStorage();
  state.reports = reports;
};

// Find tab by Map() object key
const findTab = (index) => state.tabs.get(index);

// Find report occurence in tab
export const findReportInTab = (id) => {
  let activeTabIndex = undefined;
  state.tabs.forEach((tab, index) => {
    if (tab.report.id === id) activeTabIndex = index;
  });
  return activeTabIndex;
};

// Initialize single tab
const initTab = (tabIndex) =>
  state.tabs.set(tabIndex, {
    report: {},
  });

// prettier-ignore
export const filterSearch = (query, filterBy) => {
  state.search.results = [];
  state.search.query = query.toLowerCase();
  state.search.filterBy = filterBy;

  const keys = state.search.filterBy.split(".");
  if (!keys[0] && !keys[0] !== "") return;

  state.reports.map((report) =>
    keys.reduce((acc, key) => {
      // Check if acc[key] exists and is an object
      if (acc && typeof acc[key] === "object") {
        // Continue traversing the object
        acc = acc[key];
      }

      // If the current value is the last key
      if (key === keys[keys.length - 1]) {
        
        // If last key is of type string
        if (typeof acc[key] === "string") {

          // And if string value includes query, push report into results array
          if (acc[key].toLowerCase().includes(state.search.query))
            return state.search.results.push(report);
        }

        // Else if last key is of type boolean
        if (typeof acc[key] === "boolean") {

          // And if value is true, allow "yes" into the query. Push report into results array
          if (acc[key] && state.search.query.includes("yes"))
            return state.search.results.push(report);

          // Or if value is false, allow "no" into the query. Push report into results array
          if (!acc[key] && state.search.query.includes("no"))
            return state.search.results.push(report);
        }

        // Else if last key is of type object, loop through key values typeof string
        if (typeof acc === "object") {
          for (const value of Object.values(acc)) {
            if (typeof value === "string") {

              // if string value includes query, push report into results array
              if (value.toLowerCase().includes(state.search.query)) {
                return state.search.results.push(report);
              }
            }
          }
        }
      }

      return acc;
    }, report)
  );

  // console.log(state.search.results);
};

// Set/Update rows per page
export const rowsPerPage = (page = state.search.page) => {
  // Example, page = 3, rowsPerPage = 25
  state.search.page = page;

  // const start = (3 - 1) * 25 = 50
  const start = (page - 1) * state.rowsPerPage;

  // const end = 3 * 25 = 75
  const end = page * state.rowsPerPage;

  // If there is a query, slice results, else slice all reports. (start = 50, end = 75)
  if (state.search.query === "") return state.reports.slice(start, end);
  else return state.search.results.slice(start, end);
};

// prettier-ignore
// Set/Update page numbers (previous page, current page, and next page)
export const pages = (page = state.search.page) => {
  state.search.page = page < 1 ? 1 : page;

  // If there are search results, calculate pages on search results, else calculate pages on all reports
  const reports = state.search.results.length > 0 ? state.search.results : state.reports;

  // Calculate the total number of pages available
  const totalPages = Math.ceil(reports.length / state.rowsPerPage);

  // Current page and next page can never be greater than the total of pages
  const currentPage = state.search.page > totalPages ? totalPages : state.search.page;
  const nextPage = currentPage + 1 > totalPages ? null : currentPage + 1;

  // Previous page can never be less than 1
  const previousPage = currentPage - 1 < 1 ? null : currentPage - 1;

  return {
    previous: previousPage,
    current: currentPage,
    next: nextPage,
  };
};

// Initialize number of tabs
export const initNumberOfTabs = function (numberOfTabs = 5) {
  if (numberOfTabs < 1 || numberOfTabs > 5) numberOfTabs = 5;
  const tabs = new Array(numberOfTabs).fill("tab");
  tabs.forEach((_, tabIndex) => initTab(tabIndex));
  return tabs;
};

// Save theme to the local browser storage
export const saveThemeInLocalStorage = function () {
  localStorage.setItem("theme", `${state.theme}`);
};

// Switch theme to dark mode or light mode
export const switchTheme = function (theme = "light") {
  if (theme !== "light" && theme !== "dark")
    throw new Error(`Invalid theme, "${theme}" does not exist.`);
  if (theme === "dark") return (state.theme = "light");
  if (theme === "light") return (state.theme = "dark");
};

// Init theme from the local browser storage
const initThemeInLocalStorage = function () {
  let theme = localStorage.getItem("theme");
  if (!theme) (theme = "light"), saveThemeInLocalStorage();
  state.theme = theme;
};

const init = function () {
  deepFreeze(DEFAULT_REPORT);
  initReportsInLocalStorage();
  initThemeInLocalStorage();
};

init();

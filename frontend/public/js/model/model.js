import {
  DEFAULT_REPORT,
  DEFAULT_USER_CREATE,
  DEFAULT_USER_UPDATE,
} from "../config.js";
import { migrateReportData } from "./migrate.js";
import api from "./api.js";
import utils from "./utils.js";

export const migrateReport = migrateReportData;
export const state = {
  version: null,
  theme: localStorage.getItem("theme") || "light",

  user: {
    account: {},
    reports: [],
    reportsDeleted: [],
  },

  users: [],

  tab: 0,
  tabs: new Map(),
  clipboard: new Map(),

  reports: [],
  reportsDeleted: [],

  rowsPerPage: null,
  search: {
    query: "",
    filterBy: "",
    results: [],
    page: 1,
  },
};

// Find report index or user index by ID
// prettier-ignore
const findObjectIndexById = (array, targetObject, raiseErrorIfNotFound = true) => {
  const index = array.findIndex((object) =>
    object.id === (typeof targetObject === "object" ? targetObject.id : targetObject));
  if(index === -1 && raiseErrorIfNotFound)
    throw new TypeError(`Invalid target. Object index is undefined in provided array.`);
  return index;
}

// Find report or user by ID
export const findObjectById = (array, id, raiseErrorIfNotFound = true) => {
  const object = array.find((object) => object.id === id);
  if (typeof object === "undefined" && raiseErrorIfNotFound)
    throw new TypeError(`Invalid id "${id}". Data object is undefined.`);
  return object;
};

// Load report into a tab
export const loadTabWith = function (array, tabIndex, id) {
  const tab = findTab(tabIndex);
  tab.data = findObjectById(array, id);
  return tab.data;
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
  utils.traverse(hasSameValueTypes, DEFAULT_REPORT, report);

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
    id: report?.id ?? utils.generateUUID(),
    version: state.version,
    createdDateTime: utils.formatDate(report?.createdDateTime).iso ?? new Date().toISOString(),
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
      dateTime: utils.formatDate(`${form.date.value.trim()} ${form.time.value.trim()}`).sharepoint,
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
      dateTime: utils.formatDate(
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
// Update existing report.
export const updateReport = function (reportOrId, form) {
  const index = findObjectIndexById(state.reports, reportOrId);
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

  return report;
};

// Update report key values. Update local storage
// Only "isWebhookSent" and "hasTriggeredWebhook" keys are allowed
const updateReportKeyValue = function (report, key, value) {
  const index = findObjectIndexById(state.reports, report);
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

// Clear data in current tab
export const clearTab = function (tabIndex) {
  const tab = findTab(tabIndex);
  tab.data = {};
  return tab.data;
};

// // Add a single report. Update local storage. Send a backup of the report
// export const addReport = function (report) {
//   state.reports.unshift(report);
//   saveReportsInLocalStorage();
//   api.sendBackupReports([report]);
//   return report;
// };

// Remove a single report. Update local storage. Send a backup of the report
// export const deleteReport = function (report) {
//   report.isDeleted = true;
//   report.tableRowEl.remove();

//   const index = findObjectIndexById(report);
//   state.reports.splice(index, 1);
//   saveReportsInLocalStorage();
//   api.sendBackupReports([report]);
//   return report;
// };

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

// Find tab index by id
export const findTabIndexByObjectId = (id) => {
  let activeTabIndex = -1;
  state.tabs.forEach((tab, index) => {
    if (tab.data.id === id) activeTabIndex = index;
  });
  return activeTabIndex;
};

// Initialize single tab
const initTab = (tabIndex) =>
  state.tabs.set(tabIndex, {
    data: {},
  });

// prettier-ignore
export const filterSearch = (array, query, filterBy) => {
  state.search.results = [];
  state.search.query = query.toLowerCase();
  state.search.filterBy = filterBy;

  const keys = state.search.filterBy.split(".");
  if (!keys[0] && !keys[0] !== "") return;

  array.map((report) =>
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
export const rowsPerPage = (array, page = state.search.page) => {
  // Example, page = 3, rowsPerPage = 25
  state.search.page = page;

  // const start = (3 - 1) * 25 = 50
  const start = (page - 1) * state.rowsPerPage;

  // const end = 3 * 25 = 75
  const end = page * state.rowsPerPage;

  // If there is a query, slice results, else slice all reports. (start = 50, end = 75)
  if (state.search.query === "") {
    if (!Array.isArray(array))
      return new TypeError(
        "Invalid array. Expects an array to slice the content into pages"
      );
    return array.slice(start, end);
  } else return state.search.results.slice(start, end);
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

// prettier-ignore
export const createUserObject = function (form) {
  const username = form.email.value.trim().split("@")[0];
  let initials = null;

  if (username.includes(".")) {
    const firstName = username.split(".")[0];
    const lastName = username.split(".")[1];
    initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  return {
    role: form.role?.value.trim(),
    isEnabled: form.status?.value.trim() === "1" ? true : false,
    email: form.email?.value.trim(),
    fullName: form["full-name"]?.value.trim(),
    username: form.username?.value.trim(),
    initials: form.initials?.value.trim(),
    password: form.password?.value.trim(),
    passwordConfirmation: form["password-confirmation"]?.value.trim(),
    profilePictureURI: form["profile-picture-uri"]?.value.trim(),
    tableRowEl: {},
  };
};

// Update existing user.
export const updateUserObject = function (userObjectOrId, form) {
  const index = findObjectIndexById(state.users, userObjectOrId);
  const user = state.users[index];
  const tableRowEl = user.tableRowEl;
  user.tableRowEl = {};

  // Create a clone of the user object to update
  let clone = structuredClone(user);

  // Update the clone separately with new data from the form
  clone.role = form.role?.value.trim();
  clone.isEnabled = form.status?.value.trim() === "1" ? true : false;
  clone.email = form.email?.value.trim();
  clone.fullName = form["full-name"]?.value.trim();
  clone.username = form.username?.value.trim();
  clone.initials = form.initials?.value.trim();
  clone.profilePictureURI = form["profile-picture-uri"]?.value.trim();

  // Check validity of the clone. If not valid, an error will be thrown here.
  checkUserValidity(DEFAULT_USER_UPDATE, clone);

  // Update the user
  user.role = clone.role;
  user.isEnabled = clone.isEnabled;
  user.email = clone.email;
  user.fullName = clone.fullName;
  user.username = clone.username;
  user.initials = clone.initials;
  // user.profilePictureURI = clone.profilePictureURI;
  user.tableRowEl = tableRowEl;

  return user;
};

// Check validity of a user object by looking at data types
export const checkUserValidity = (configObject, user) => {
  const missingKeys = [];
  const invalidTypes = [];

  // prettier-ignore
  const hasSameValueTypes = (defaultObject, targetObject, key, currentObject) => {
    const target = typeof currentObject === "undefined" ? "root" : currentObject;

    // If the target object does not exist, throw an error. (For nested objects)
    if (typeof targetObject === "undefined") throw new Error(`Failed to create user. The "${target}" object was not found.`)

    // Key Names. Sort by alphabetical order to compare them
    const defaultKeys = Object.keys(defaultObject).sort();
    const userKeys = Object.keys(targetObject).sort();

    // console.log("DEFAULT:", defaultKeys);
    // console.log("USER`:", userKeys);

    // If the given number keys inside the default object !== the number keys inside the target object (user)
    if (defaultKeys.length !== userKeys.length) {

      // Throw an error. In this case, it means that the 2 objects have different lengths.
      throw new Error(`Failed to create a user object. The number of keys found inside the "${target}" object is invalid.`);
    }

    // Key Values
    const defaultKeyValue = defaultObject[key];
    const targetKeyValue = targetObject[key];

    // If the target (user) object key value does not exist
    if (typeof targetKeyValue === "undefined") {

      // Keep it in memory, and return nothing to stop the iteration.
      return missingKeys.push(key);
    }

    // If the default object key value types !== the target (user) object key value types
    if (typeof defaultKeyValue !== typeof targetKeyValue) {

      // if key "initials" & "profilePictureURI" is null stop the iteration by returning nothing. "initials" & "profilePictureURI" can === null.
      if(key === "initials" || "profilePictureURI") {
        if (targetKeyValue === null || typeof targetKeyValue === "string") return;

        // Else keep it in memory, and return nothing to stop the iteration.
        return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
      }

      // Else keep it in memory, and return nothing to stop the iteration.
      return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
    }
  };

  // Traverse default user object, and compare data types with user object passed in parameter
  utils.traverse(hasSameValueTypes, configObject, user);

  const hasMissingKeys = missingKeys.length > 0;
  const hasinvalidTypes = invalidTypes.length > 0;

  // prettier-ignore
  // Parse errors into a single string message
  if (hasMissingKeys || hasinvalidTypes) {
    throw new Error(
      `Failed to create a user object${
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

  if (user.initials.length > 2) invalidInputLengths.push("initials");
  if (user.username.length > 20) invalidInputLengths.push("username");

  const hasInvalidInputLength = invalidInputLengths.length > 0;
  // prettier-ignore
  if (hasInvalidInputLength) {
    throw new Error(`The following fields have invalid lengths: ${invalidInputLengths.join(", ")}.`);
  }
};

export const SERVER = {
  // TO TEST
  sendReportToIncomingWebhook: async (id) => {
    await api.v1.webhook.sendReportToIncomingWebhook(id);
  },
};

export const DB = {
  getReports: async () => {
    // API request to get all reports from the database
    const {
      data: { data },
    } = await api.v1.reports.getReports();

    // Add all reports in the model state
    state.reports = data;

    return data;
  },

  createReport: async (tabReport, form) => {
    // Create a report object
    const reportObject = createReportObject(tabReport, form);

    // Check validity of the report object
    checkValidity(reportObject);

    // API request to create a report in the database
    const {
      data: {
        data: [report],
      },
    } = await api.v1.reports.createReport(reportObject);

    // Add the report in the model state
    state.reports.unshift(report);

    return report;
  },

  getReport: async (id) => {
    const {
      data: {
        data: [report],
      },
    } = await api.v1.reports.getReport(id);

    return report;
  },

  updateReport: async (id, form) => {
    // Update a report object
    const report = updateReport(id, form);
    const tableRowEl = report.tableRowEl;
    report.tableRowEl = undefined;

    // API request to update a report from the database
    await api.v1.reports.updateReport(id, report);

    report.tableRowEl = tableRowEl;

    return report;
  },

  deleteReport: async (id) => {
    // API request to delete a report from the database
    const { response } = await api.v1.reports.deleteReport(id);

    // Find & check if report is in the state object
    const index = findObjectIndexById(state.reports, id, false);

    // If found, remove the row element and report object
    if (index !== -1) {
      state.reports[index].tableRowEl.remove();
      state.reports.splice(index, 1);
    }

    return response;
  },

  getSoftDeletedReports: async () => {
    // API request to get all reports from the database
    const {
      data: { data },
    } = await api.v1.reports.getSoftDeletedReports();
    console.log(data);

    // Add all reports in the model state
    state.reportsDeleted = data;
  },

  undoSoftDeleteReport: async (id) => {
    // API request to undo a soft deleted report from the database
    const { response } = await api.v1.reports.undoSoftDeleteReport(id);

    // Find & check if report is in the state object
    const index = findObjectIndexById(state.reportsDeleted, id, false);

    // If found, remove the row element and report object
    if (index !== -1) {
      state.reportsDeleted[index].tableRowEl.remove();
      state.reportsDeleted.splice(index, 1);
    }

    return response;
  },

  getUsers: async () => {
    // API request to get all users from the database
    const {
      data: { data },
    } = await api.v1.users.getUsers();

    // Add all users in the model state
    state.users = data;

    state.users.forEach((user) => {
      if (!user.profilePictureURI)
        user.profilePictureURI = "/img/default_profile_picture.jpg";
    });

    return data;
  },

  createUser: async (form) => {
    // Create a user object
    const userObject = createUserObject(form);

    // Check validity of the user object
    checkUserValidity(DEFAULT_USER_CREATE, userObject);

    // API request to create a user in the database
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.createUser(userObject);

    console.log(user);

    // Add the user in the model state
    state.users.unshift(user);

    return user;
  },

  getUser: async (id) => {
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.getUser(id);

    return user;
  },

  updateUser: async (id, form) => {
    // Update a user object
    const user = updateUserObject(id, form);
    const tableRowEl = user.tableRowEl;
    user.tableRowEl = undefined;

    // API request to update a user from the database
    await api.v1.users.updateUser(id, user);

    user.tableRowEl = tableRowEl;

    return user;
  },

  deleteUser: async (id) => {
    // API request to delete a user from the database
    const { response } = await api.v1.users.deleteUser(id);

    // Find & check if user is in the state object
    const index = findObjectIndexById(state.users, id, false);

    // If found, remove the row element and user object
    if (index !== -1) {
      state.users[index].tableRowEl.remove();
      state.users.splice(index, 1);
    }

    return response;
  },

  enableUser: async (id, userObject) => {
    // API request to enable a user from the database
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.enableUser(id);

    // Update the status in the user object
    userObject.isEnabled = user.isEnabled;

    return userObject;
  },

  disableUser: async (id, userObject) => {
    // API request to disable a user from the database
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.disableUser(id);

    // Update the status in the user object
    userObject.isEnabled = user.isEnabled;

    return userObject;
  },

  // prettier-ignore
  resetUserPassword: async (id, form) => {
    const password = form.password?.value.trim();
    const passwordConfirmation = form["password-confirmation"]?.value.trim();

    // API request to reset the password of an existing user from the database
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.resetUserPassword(id, password, passwordConfirmation);

    return user;
  },

  // TO TEST
  getCurrentUserAccount: async () => {
    // API request to get the current signed in user account from the database
    const {
      data: {
        data: [user],
      },
    } = await api.v1.users.getCurrentUser();

    state.user = user;

    return user;
  },
};

export const init = async function () {
  utils.deepFreeze(DEFAULT_REPORT);
  await Promise.all([
    DB.getCurrentUserAccount(),
    DB.getReports(),
    DB.getSoftDeletedReports(),
    DB.getUsers(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

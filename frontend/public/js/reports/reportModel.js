import {
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,
  initThemeInLocalStorage,
} from "../model.js";
import { DEFAULT_REPORT } from "../config.js";
import api from "../api.js";
import utils from "../utils.js";

import * as accountModel from "../account/accountModel.js";

// 1st function to be ran by ./reportController.js
const init = async () => {
  utils.deepFreeze(DEFAULT_REPORT);
  await Promise.all([
    DB.getReports(),
    DB.getAllSoftDeletedReports(),
    DB.synchonizeFormData(),
    // accountModel.DB.getCurrentUserAccount(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

// API requests linked to the backend database
const DB = {
  getReports: async () => {
    // API request to get all reports from the database
    const {
      data: { data },
    } = await api.v1.reports.getReports();

    // Add all reports in the model state
    state.reports = data;

    return data;
  },

  importReports: async (uniqueReportsArray) => {
    for (const report of uniqueReportsArray) {
      // API request to create a report in the database
      await api.v1.reports.createReport(report);
    }
  },

  createReport: async (tabReport, form) => {
    // Create a report object
    const reportObject = createReportObject(tabReport, form);

    console.log(reportObject);

    // Check validity of the report object
    checkReportValidity(reportObject);

    // API request to create a report in the database
    const {
      data: { data: report },
    } = await api.v1.reports.createReport(reportObject);

    // Add the report in the model state
    state.reports.unshift(report);

    return report;
  },

  // NOT USED
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

  hardDeleteReport: async (id, password) => {
    // API request to hard delete a report from the database
    // Requires elevated permission + password
    const { response } = await api.v1.reports.hardDeleteReport(id, password);

    // Find & check if report is in the state object
    const index = findObjectIndexById(state.reports, id, false);

    // If found, remove the row element and report object
    if (index !== -1) {
      state.reports[index].tableRowEl.remove();
      state.reports.splice(index, 1);
    }

    return response;
  },

  getAllSoftDeletedReports: async () => {
    // API request to get all reports from the database
    const {
      data: { data },
    } = await api.v1.reports.getAllSoftDeletedReports();
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

  synchonizeFormData: async () => {
    const {
      data: { data },
    } = await api.v1.formData.synchonizeFormData();

    console.log(data.selects);

    state.formData.selects = data.selects;
  },
};

// Check validity of a report by looking at data types
const checkReportValidity = (report) => {
  const missingKeys = [];
  const invalidTypes = [];

  // prettier-ignore
  const hasSameValueTypes = (defaultObject, targetObject, key, currentObject) => {
    const target = typeof currentObject === "undefined" ? "root" : currentObject;

    // If the target object does not exist, throw an error. (For nested objects)
    if (typeof targetObject === "undefined") throw new Error(`Failed to validate report. The "${target}" object was not found.`)

    // Key Names. Sort by alphabetical order to compare them
    const defaultKeys = Object.keys(defaultObject).sort();
    const reportKeys = Object.keys(targetObject).sort();

    // If the given number keys inside the default object !== the number keys inside the target object (report)
    if (defaultKeys.length !== reportKeys.length) {

      // And if the target (report) object has no transaction data stop the iteration by returning nothing
      if (target === "transaction" && !Object.hasOwn(targetObject, key)) return;

      // Else throw an error if none of the condition were met. In this case, it means that the 2 objects have different lengths.
      throw new Error(`Failed to validate a report object. The number of keys found inside the "${target}" object is invalid.`);
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

      // Keep it in memory, and return nothing to stop the iteration.
      return invalidTypes.push({ key: key, type: typeof defaultKeyValue, target: target });
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
      `Failed to validate a report object${
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

  if (report.call.phone.length > 20) invalidInputLengths.push("phone number");
  if (report.store.employee.name.length > 100)
    invalidInputLengths.push("store employee name");
  if (report.incident.title.length > 100)
    invalidInputLengths.push("incident title");
  if (report.incident.error.length > 100)
    invalidInputLengths.push("incident error code");
  // prettier-ignore
  if (report.incident.transaction.number && report.incident.transaction.number.length > 100)
    invalidInputLengths.push("incident transaction number");
  if (report.incident.details.length > 2000)
    invalidInputLengths.push("incident details");

  const hasInvalidInputLength = invalidInputLengths.length > 0;
  if (hasInvalidInputLength) {
    throw new Error(
      `The following fields have invalid character lengths: ${invalidInputLengths.join(
        ", "
      )}.`
    );
  }
};

// prettier-ignore
// Create a single report object
const createReportObject = (report, form) => {
  return {
    assignedTo: form["assigned-to"].value.trim(),
    isOnCall: form.oncall.checked,
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
        isContacted: form["store-dm-contacted"].checked,
      },
    },
    incident: {
      title: form["incident-title"].value.trim(),
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
  };
};

// prettier-ignore
// Update existing report.
const updateReport = (reportOrId, form) => {
  const index = findObjectIndexById(state.reports, reportOrId);
  const report = state.reports[index];
  const tableRowEl = report.tableRowEl;
  report.tableRowEl = {};

  // Create a clone of the report to update
  let clone = structuredClone(report);

  // Update the clone separately with new data from the form
  clone = createReportObject(clone, form);
  clone.updatedAt = new Date().toISOString();
  clone.updatedBy = state.user.username;
  clone.isWebhookSent = false;
  clone.isDeleted = false;

  // Check validity of the clone. If not valid, an error will be thrown here.
  checkReportValidity(clone);

  // Update the report
  report.assignedTo = clone.assignedTo;
  report.isOnCall = clone.isOnCall;
  report.isWebhookSent = clone.isWebhookSent;
  report.isDeleted = clone.isDeleted;
  report.tableRowEl = tableRowEl;
  report.call = clone.call;
  report.store = clone.store;
  report.incident = clone.incident;

  return report;
};

// Update report key values. Update local storage
// Only "isWebhookSent" and "hasTriggeredWebhook" keys are allowed
const updateReportKeyValue = (report, key, value) => {
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
  // saveReportsInLocalStorage();
  return state.reports[index];
};

// Update report key: "isWebhookSent" to value: true
const updateIsWebhookSent = (report) => {
  updateReportKeyValue(report, "isWebhookSent", true);
};

// Update report key: "hasTriggeredWebhook" to value: true
const updateHasTriggeredWebhook = (report) => {
  updateReportKeyValue(report, "hasTriggeredWebhook", true);
};

export {
  // from -> ../model.js
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,

  // from this local file -> ./reportModel.js
  DB,
  updateIsWebhookSent,
  updateHasTriggeredWebhook,
  checkReportValidity,
  createReportObject,
  updateReport,
  init,
};

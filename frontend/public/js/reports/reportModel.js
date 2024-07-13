import {
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  loadTab,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,
  initThemeInLocalStorage,
} from "../model.js";
import {
  DEFAULT_REPORT_CREATE,
  DEFAULT_REPORT_UPDATE,
  DEFAULT_REPORT_IMPORT,
} from "../config.js";
import api from "../api.js";
import utils from "../utils.js";

import * as accountModel from "../account/accountModel.js";
import * as userModel from "../users/userModel.js";

// 1st function to be ran by ./reportController.js
const init = async () => {
  [DEFAULT_REPORT_CREATE, DEFAULT_REPORT_UPDATE, DEFAULT_REPORT_IMPORT].forEach(
    (object) => utils.deepFreeze(object)
  );

  const page = state.search.page;
  const rowsPerPage = state.rowsPerPage;

  await Promise.all([
    DB.getAllReports(page, rowsPerPage),
    DB.getAllSoftDeletedReports(page, rowsPerPage),
    DB.synchonizeFormData(),
    userModel.DB.getUsersFrontend(),
    accountModel.DB.getCurrentUserAccount(),
  ]);
  state.version = await api.v1.version.getVersion();
  initThemeInLocalStorage();
};

// API requests linked to the backend database
const DB = {
  getAllReports: async (page, rowsPerPage) => {
    // API request to get all reports from the database
    const {
      data: { data, total },
    } = await api.v1.reports.getAllReports(page, rowsPerPage);

    // Add all reports in the model state
    state.reports = data;
    state.reportsTotal = total;

    return data;
  },

  getAllSoftDeletedReports: async (page, rowsPerPage) => {
    // API request to get all reports from the database
    const {
      data: { data, total },
    } = await api.v1.reports.getAllSoftDeletedReports(page, rowsPerPage);

    // Add all reports in the model state
    state.reportsDeleted = data;
    state.reportsDeletedTotal = total;

    return data;
  },

  getAllReportsCreatedByUser: async (page, rowsPerPage) => {
    // API request to get all reports from the database
    const {
      data: { data, total },
    } = await api.v1.reports.getAllReportsCreatedByUser(
      state.user.username,
      page,
      rowsPerPage
    );

    // Add all reports in the model state
    state.user.reports = data;
    state.user.reportsTotal = total;

    return data;
  },

  getAllSoftDeletedReportsCreatedByUser: async (page, rowsPerPage) => {
    // API request to get all reports from the database
    const {
      data: { data, total },
    } = await api.v1.reports.getAllSoftDeletedReportsCreatedByUser(
      state.user.username,
      page,
      rowsPerPage
    );

    // Add all reports in the model state
    state.user.reportsDeleted = data;
    state.user.reportsDeletedTotal = total;

    return data;
  },

  createReport: async (tabReport, form) => {
    // Create a report object
    const reportObject = createReportObject(tabReport, form);

    console.log(reportObject);

    // Check validity of the report object
    checkReportValidity(DEFAULT_REPORT_CREATE, reportObject);

    // API request to create a report in the database
    const {
      data: { data: report },
    } = await api.v1.reports.createReport(reportObject);

    // Add the report in the model state
    state.reports.unshift(report);

    return report;
  },

  getReport: async (id) => {
    const {
      data: { data: report },
    } = await api.v1.reports.getReport(id);

    return report;
  },

  updateReport: async (id, form) => {
    // Update a report object
    const [reportFound, report] = await updateReportObject(id, form);
    const tableRowEl = report.tableRowEl;

    report.tableRowEl = undefined;
    delete report.version;
    delete report.createdAt;
    delete report.createdBy;
    delete report.updatedAt;
    delete report.updatedBy;

    // API request to update a report from the database
    const {
      data: { data: reportUpdated },
    } = await api.v1.reports.updateReport(id, report);

    report.tableRowEl = tableRowEl;
    report.version = reportUpdated.version;
    report.createdAt = reportUpdated.createdAt;
    report.updatedAt = reportUpdated.updatedAt;
    report.createdBy = reportUpdated.createdBy;
    report.updatedBy = reportUpdated.updatedBy;
    report.call = reportUpdated.call;
    report.store = reportUpdated.store;
    report.incident = reportUpdated.incident;

    return [reportFound, report];
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

  softDeleteReport: async (id) => {
    // API request to soft delete a report from the database
    const { response } = await api.v1.reports.softDeleteReport(id);

    // Find & check if report is in the state object
    const index = findObjectIndexById(state.reports, id, false);

    // If found, remove the row element and report object
    if (index !== -1) {
      state.reports[index].tableRowEl.remove();
      state.reports.splice(index, 1);
    }

    return response;
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

  importReports: async (reports) => {
    const {
      data: { data },
    } = await api.v1.reports.import().importReports(reports);

    return data;
  },

  migrateReports: async (reports) => {
    const {
      data: { data },
    } = await api.v1.reports.migrate().migrateReports(reports);

    return data;
  },

  synchonizeFormData: async () => {
    const {
      data: { data },
    } = await api.v1.formData.synchonizeFormData();

    state.formData.selects = data.selects;
  },
};

// Check validity of a report by looking at data types
const checkReportValidity = (configObject, report) => {
  const missingKeys = [];
  const invalidTypes = [];

  // prettier-ignore
  const hasSameValueTypes = (defaultObject, targetObject, key, currentObject) => {
    const target = typeof currentObject === "undefined" ? "root" : currentObject;

    // If the target object does not exist, throw an error. (For nested objects)
    if (typeof targetObject === "undefined")
      throw new Error(`Failed to validate report. The "${target}" ${Array.isArray(target) ? "array" : "object"} was not found.`)

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
  utils.traverse(hasSameValueTypes, configObject, report);

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
    tableRowEl: report?.tableRowEl || {},
    call: {
      date: form.date.value.trim(),
      time: form.time.value.trim(),
      phone: form["phone-no-caller-id"].checked
        ? "No Caller ID"
        : form["phone-number"].value.trim(),
      status: form["status"].value.trim(),
    },
    store: {
      numbers: [form["store-numbers"].value.trim()],
      employee: {
        name: form["store-employee"].value.trim(),
        isStoreManager: form["store-manager"].checked,
      },
    },
    incident: {
      title: form["incident-title"].value.trim(),
      types: [form["incident-types"].value.trim()],
      pos: form["incident-pos-number"].value.trim(),
      isProcedural: form["incident-procedural"].checked,
      error: form["incident-error-code"].value.trim(),
      transaction: form["transaction-issue"].checked
        ? {
            types: [form["transaction-types"].value.trim()],
            number: form["transaction-number"].value.trim(),
            hasVarianceReport: form["transaction-variance-report"].checked,
          }
        : {},
      details: form["incident-details"].value.trim(),
    },
  };
};

// prettier-ignore
// Update existing report.
const updateReportObject = async (reportOrId, form) => {
  let report, tableRowEl;
  
  const index = findObjectIndexById(state.reports, reportOrId, false);
  const reportFound = index !== -1;

  if (reportFound) {
    report = state.reports[index];
    tableRowEl = report.tableRowEl;
    report.tableRowEl = {};
  }

  if (!reportFound) report = await DB.getReport(reportOrId);

  // Create a clone of the report to update
  let clone = structuredClone(report);

  // Update the clone separately with new data from the form
  clone = createReportObject(clone, form);
  clone.isDeleted = false;
  clone.isWebhookSent = false;
  clone.hasTriggeredWebhook = false;

  // Check validity of the clone. If not valid, an error will be thrown here.
  checkReportValidity(DEFAULT_REPORT_UPDATE, clone);

  // Update the report
  report.assignedTo = clone.assignedTo;
  report.isOnCall = clone.isOnCall;
  report.isDeleted = clone.isDeleted;
  report.isWebhookSent = clone.isWebhookSent;
  report.hasTriggeredWebhook = clone.hasTriggeredWebhook;
  report.tableRowEl = tableRowEl;
  report.call = clone.call;
  report.store = clone.store;
  report.incident = clone.incident;

  return [reportFound, report];
};

export {
  // from -> ../model.js
  state,
  initNumberOfTabs,
  clearTab,
  loadTabWith,
  loadTab,
  pages,
  rowsPerPage,
  filterSearch,
  findObjectById,
  findObjectIndexById,
  findTabIndexByObjectId,

  // from -> ../config.js
  DEFAULT_REPORT_IMPORT,

  // from this local file -> ./reportModel.js
  DB,
  checkReportValidity,
  createReportObject,
  updateReportObject,
  init,
};

import validator from "validator";

import {
  mssql,
  mssqlDataTypes,
  config,
  dateISO8601,
  dateMSSharePoint,
  GlobalError,
  cliLogger,
} from "../router.js";
import reportSchema from "./report.schema.js";

const { NVARCHAR, VARCHAR, INT, BIT, DATETIMEOFFSET, DATE, TIME } =
  mssqlDataTypes;

// Custom validation to check if username exists in DB & and user is active
export { isUsername, isValidUsername } from "../users/user.model.js";

// Custom validation to check if an array is not empty
export const isNotEmptyArray = (array) => array.length > 0;

// Custom date & time validation function for checkSchema in reportController.js
export const isDateTime = (value) => {
  const dateTime = value.split(" ");
  if (dateTime.length > 3) throw new Error();

  let [unformattedDate, unformattedTime, amPm] = dateTime;
  let [month, day, year] = unformattedDate.split("/");
  if (Number(month) < 10 && month.length === 1) month = `0${month}`;
  if (Number(day) < 10 && day.length === 1) day = `0${day}`;

  const date = `${month}/${day}/${year}`;
  const isValidDate = validator.isDate(date, {
    format: "MM/DD/YYYY",
    strictMode: true,
  });

  const time = `${unformattedTime} ${amPm}`;
  const isValidTime = validator.isTime(time, { hourFormat: "hour12" });

  if (!isValidDate || !isValidTime) return false;
  return true;
};

// Custom time validation function for checkSchema in reportController.js
export const isTimeCustom = (value) => {
  const hour12 = validator.isTime(value, { hourFormat: "hour12" });
  if (hour12) return true;

  // prettier-ignore
  const hour12WithSeconds = validator.isTime(value, { hourFormat: "hour12", mode: "withSeconds" });
  if (hour12WithSeconds) return true;

  const hour24 = validator.isTime(value, { hourFormat: "hour24" });
  if (hour24) return true;

  // prettier-ignore
  const hour24withSeconds = validator.isTime(value, { hourFormat: "hour24", mode: "withSeconds" });
  if (hour24withSeconds) return true;

  return false;
};

// Placeholder function to insert data into many to many SQL tables tied to reports
// Data is escaped to prevent SQL injection
const insertManyToMany = (array, reportId, mssql, insertFunction) => {
  if (!array || !Array.isArray(array) || array.length === 0) return;

  const rows = [];

  array.forEach((value, i) => {
    const param = `param_${insertFunction.name}_${i}`;
    rows.push(insertFunction().row(param));

    // console.log("PARAM:", param, ", VALUE:", value, typeof value);
    mssql.input(param, value);
  });

  mssql.input(`reportId_${insertFunction.name}`, INT, reportId);

  return insertFunction().query(rows);
};

export const Reports = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A REPORT        /api/v1/reports         (POST)
   * UPDATING A REPORT        /api/v1/reports/:id     (PUT)
   * HARD DELETING A REPORT   /api/v1/reports/:id     (DELETE)
   * IMPORTING REPORTS        /api/v1/reports/import  (POST)
   **/
  schema: {
    create: reportSchema.create,
    update: reportSchema.update,
    hardDelete: reportSchema.hardDelete,
    import: reportSchema.import,
  },

  // GET SINGLE REPORT BY ID
  async findById(id) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", INT, id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_getById");

    const report = JSON.parse(rawJSON);

    return report ? report : undefined;
  },

  // GET ALL REPORTS CREATED BY A USER, OR GET ALL SOFT DELETED REPORTS CREATED BY A USER
  async createdBy(
    userId,
    pageNumber = 1,
    rowsPerPage = 500,
    softDeleted = false
  ) {
    rowsPerPage =
      rowsPerPage < 0 || rowsPerPage > 500 ? (rowsPerPage = 500) : rowsPerPage;
    pageNumber = pageNumber < 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { report: rawJSON, count },
    } = await mssql()
      .request.input("userId", INT, userId)
      .input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .output("report", NVARCHAR)
      .output("count", INT)
      .execute(
        softDeleted
          ? "api_v1_reports_getAllSoftDeletedCreatedByUserId"
          : "api_v1_reports_getAllCreatedByUserId"
      );

    const reports = JSON.parse(rawJSON);

    return !reports
      ? { total: 0, results: 0, data: [] }
      : { total: count, results: reports.length, data: reports };
  },

  // SOFT DELETE SINGLE REPORT BY ID
  async softDelete(report) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", INT, report.id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_softDeleteById");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // UNDO SOFT DELETE SINGLE REPORT BY ID
  async undoSoftDelete(report) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", INT, report.id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_softDeleteUndoById");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // TRANSFER SINGLE REPORT OWNERSHIP TO ANOTHER USER
  async transferReportOwnershipTo(userId, updatedByUserId, report) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("transferToUserId", INT, userId)
      .input("updatedByUserId", INT, updatedByUserId)
      .input("id", INT, report.id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_transferReportOwnershipToUserId");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // GET ALL REPORTS, OR GET ALL SOFT DELETED REPORTS
  async all(pageNumber = 1, rowsPerPage = 500, softDeleted = false) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 500 ? (rowsPerPage = 500) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { report: rawJSON, count },
    } = await mssql()
      .request.input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .output("report", NVARCHAR)
      .output("count", INT)
      .execute(
        softDeleted
          ? "api_v1_reports_getAllSoftDeleted"
          : "api_v1_reports_getAll"
      );

    const reports = JSON.parse(rawJSON);

    return !reports
      ? { total: 0, results: 0, data: [] }
      : { total: count, results: reports.length, data: reports };
  },

  // CREATE A NEW REPORT
  // prettier-ignore
  async create(body, createdByAndUpdatedBy, assignedTo, transaction) {
    let reportHasTransaction = true;

    body.version = config.version;
    // Same user id for created by and updated by
    body.createdBy = createdByAndUpdatedBy;
    body.updatedBy = createdByAndUpdatedBy;
    body.assignedTo = assignedTo;
    body.call.dateTime = dateMSSharePoint(
      `${body.call.date} ${body.call.time}`
    );
    if (!body.incident.transaction.types) 
      (body.incident.transaction = {}), (reportHasTransaction = false);

    const reportCreate = mssql(transaction).request;

    reportCreate.input("version", VARCHAR, body.version);
    reportCreate.input("createdBy", INT, body.createdBy);
    reportCreate.input("updatedBy", INT, body.updatedBy);
    reportCreate.input("assignedTo", INT, body.assignedTo);
    reportCreate.input("isOnCall", BIT, body.isOnCall);
    reportCreate.input("callDate", DATE, body.call.date);
    reportCreate.input("callTime", TIME, body.call.time);
    reportCreate.input("callDateTime", VARCHAR, body.call.dateTime);
    reportCreate.input("callPhone", VARCHAR, body.call.phone);
    reportCreate.input("callStatus", VARCHAR, body.call.status);
    reportCreate.input("storeEmployeeName", VARCHAR, body.store.employee.name);
    reportCreate.input("storeEmployeeIsStoreManager", BIT, body.store.employee.isStoreManager);
    reportCreate.input("incidentTitle", VARCHAR, body.incident.title);
    reportCreate.input("incidentPos", VARCHAR, body.incident.pos);
    reportCreate.input("incidentIsProcedural", BIT, body.incident.isProcedural);
    reportCreate.input("incidentError", VARCHAR, body.incident.error);
    reportCreate.input("incidentHasVarianceReport", BIT, body.incident.hasVarianceReport);
    reportCreate.input("incidentTransactionNumber", VARCHAR, body.incident.transaction.number);
    reportCreate.input("incidentDetails", VARCHAR, body.incident.details);

    const { output: { id } } = await reportCreate
      .output("id", INT)
      .execute("api_v1_reports_create");

    const queries = [
      insertManyToMany(body.store.numbers, id, reportCreate, this.insertStores),
      insertManyToMany(body.incident.types, id, reportCreate, this.insertIncidentTypes),
    ]
        
    if(reportHasTransaction) 
      queries.push(
        insertManyToMany(body.incident.transaction.types, id, reportCreate, this.insertIncidentTransactionTypes)
      );

    await reportCreate.query(queries.join(" "));
    
    const {
      output: { report: rawJSON },
    } = await mssql(transaction)
      .request.input("id", INT, id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_getById");
      
    const reportCreated = JSON.parse(rawJSON);
    if(!reportHasTransaction) reportCreated.incident.transaction = {};

    return reportCreated;
  },

  // UPDATE AN EXISTING REPORT
  // prettier-ignore
  async update(body, report, updatedBy, transaction) {
    let reportHasTransaction = true;

    body.version = config.version;
    body.createdBy = report.createdBy;
    body.updatedBy = updatedBy;
    if(body.call.date !== report.call.date || body.call.time !== report.call.time)
      body.call.dateTime = dateMSSharePoint(
        `${body.call.date} ${body.call.time}`
      );
    if (!body.incident.transaction.types)
      (body.incident.transaction = {}), (reportHasTransaction = false);
    
    const reportUpdate = mssql(transaction).request;

    reportUpdate.input("reportId", INT, report.id);
    reportUpdate.input("version", VARCHAR, body.version);
    reportUpdate.input("createdBy", VARCHAR, body.createdBy);
    reportUpdate.input("updatedBy", VARCHAR, body.updatedBy);
    reportUpdate.input("assignedTo", VARCHAR, body.assignedTo);
    reportUpdate.input("isOnCall", BIT, body.isOnCall);
    reportUpdate.input("isDeleted", BIT, body.isDeleted);
    reportUpdate.input("isWebhookSent", BIT, body.isWebhookSent);
    reportUpdate.input("hasTriggeredWebhook", BIT, body.hasTriggeredWebhook);
    reportUpdate.input("callDate", DATE, body.call.date);
    reportUpdate.input("callTime", TIME, body.call.time);
    reportUpdate.input("callDateTime", VARCHAR, body.call.dateTime);
    reportUpdate.input("callPhone", VARCHAR, body.call.phone);
    reportUpdate.input("callStatus", VARCHAR, body.call.status);
    reportUpdate.input("storeEmployeeName", VARCHAR, body.store.employee.name);
    reportUpdate.input("storeEmployeeIsStoreManager", BIT, body.store.employee.isStoreManager);
    reportUpdate.input("incidentTitle", VARCHAR, body.incident.title);
    reportUpdate.input("incidentPos", VARCHAR, body.incident.pos);
    reportUpdate.input("incidentIsProcedural", BIT, body.incident.isProcedural);
    reportUpdate.input("incidentError", VARCHAR, body.incident.error);
    reportUpdate.input("incidentHasVarianceReport", BIT, body.incident.hasVarianceReport);
    reportUpdate.input("incidentTransactionNumber", VARCHAR, body.incident.transaction.number);
    reportUpdate.input("incidentDetails", VARCHAR, body.incident.details);

    await reportUpdate.execute("api_v1_reports_update");

    await this.deleteStoresIncidentTypesIncidentTransactionTypes(report.id);

    const queries = [
      insertManyToMany(body.store.numbers, report.id, reportUpdate, this.insertStores),
      insertManyToMany(body.incident.types, report.id, reportUpdate, this.insertIncidentTypes),
    ]
        
    if(reportHasTransaction) {
      queries.push(
        insertManyToMany(body.incident.transaction.types, report.id, reportUpdate, this.insertIncidentTransactionTypes)
      )
    }

    await reportUpdate.query(queries.join(" "));

    const {
      output: { report: rawJSON },
    } = await mssql(transaction).request
      .input("id", INT, report.id)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_getById");

    const reportUpdated = JSON.parse(rawJSON);
    if(!reportHasTransaction) reportUpdated.incident.transaction = {};

    return reportUpdated;
  },

  // DELETE AN EXISTING REPORT **THIS ACTION IS IRREVERSIBLE**
  hardDelete(report, transaction) {
    return mssql(transaction)
      .request.input("reportId", INT, report.id)
      .execute("api_v1_reports_delete");
  },

  // INSERT/ASSIGN A STORE TO A REPORT
  // prettier-ignore
  insertStores() {
    return {
      row: (param) =>
        `(@reportId_insertStores, (SELECT id FROM stores WHERE number = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportStores (report_id, store_id) VALUES ${rows.join(", ")};`,
    };
  },

  // INSERT/ASSIGN AN INCIDENT TYPE TO A REPORT
  // prettier-ignore
  insertIncidentTypes() {
    return {
      row: (param) =>
        `(@reportId_insertIncidentTypes, (SELECT id FROM incidentTypes WHERE type = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportIncidentTypes (report_id, incidentType_id) VALUES ${rows.join(", ")};`,
    };
  },

  // INSERT/ASSIGN AN INCIDENT TRANSACTION TYPE TO A REPORT
  // prettier-ignore
  insertIncidentTransactionTypes() {
    return {
      row: (param) =>
        `(@reportId_insertIncidentTransactionTypes, (SELECT id FROM incidentTransactionTypes WHERE type = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportIncidentTransactionTypes (report_id, incidentTransactionType_id) VALUES ${rows.join(", ")};`,
    };
  },

  // DELETE ALL STORES, INCIDENT TYPES, & INCIDENT TRANSACTION TYPES ASSIGNED TO A REPORT
  async deleteStoresIncidentTypesIncidentTransactionTypes(reportId) {
    return mssql()
      .request.input("reportId", INT, reportId)
      .execute(
        "api_v1_reports_delete_store_incidentType_incidentTransactionType"
      );
  },

  // IMPORT REPORTS
  // prettier-ignore
  async import(body, transaction) {
    const reportsImported = [];

    let i = 1;
    for (const report of body) {
      report.version = config.version;
      report.createdAt = dateISO8601(report.createdAt);
      report.updatedAt = dateISO8601(report.updatedAt);
      report.call.dateTime = dateMSSharePoint(
        `${report.call.date} ${report.call.time}`
      );
      if (!report.incident.transaction.types) report.incident.transaction = {};
      
      const reportImport = mssql(transaction).request;

      reportImport.input("version", VARCHAR, report.version);
      reportImport.input("createdAt", DATETIMEOFFSET, report.createdAt);
      reportImport.input("updatedAt", DATETIMEOFFSET, report.updatedAt);
      reportImport.input("createdBy", VARCHAR, report.createdBy);
      reportImport.input("updatedBy", VARCHAR, report.updatedBy);
      reportImport.input("assignedTo", VARCHAR, report.assignedTo);
      reportImport.input("isOnCall", BIT, report.isOnCall);
      reportImport.input("isDeleted", BIT, report.isDeleted);
      reportImport.input("isWebhookSent", BIT, report.isWebhookSent);
      reportImport.input("hasTriggeredWebhook", BIT, report.hasTriggeredWebhook);
      reportImport.input("callDate", DATE, report.call.date);
      reportImport.input("callTime", TIME, report.call.time);
      reportImport.input("callDateTime", VARCHAR, report.call.dateTime);
      reportImport.input("callPhone", VARCHAR, report.call.phone);
      reportImport.input("callStatus", VARCHAR, report.call.status);
      reportImport.input("storeEmployeeName", VARCHAR, report.store.employee.name);
      reportImport.input("storeEmployeeIsStoreManager", BIT, report.store.employee.isStoreManager);
      reportImport.input("incidentTitle", VARCHAR, report.incident.title);
      reportImport.input("incidentPos", VARCHAR, report.incident.pos);
      reportImport.input("incidentIsProcedural", BIT, report.incident.isProcedural);
      reportImport.input("incidentError", VARCHAR, report.incident.error);
      reportImport.input("incidentHasVarianceReport", BIT, report.incident.hasVarianceReport);
      reportImport.input("incidentTransactionNumber", VARCHAR, report.incident.transaction.number);
      reportImport.input("incidentDetails", VARCHAR, report.incident.details);

      const { output: { id } } =
        await reportImport
          .output("id", INT)
          .execute("api_v1_reports_import");

      const queries = [
        insertManyToMany(report.store.numbers, id, reportImport, this.insertStores),
        insertManyToMany(report.incident.types, id, reportImport, this.insertIncidentTypes),
      ]
      
      if(report.incident.transaction.types) {
        queries.push(
          insertManyToMany(report.incident.transaction.types, id, reportImport, this.insertIncidentTransactionTypes)
        );
      }

      await reportImport.query(queries.join(" "));

      reportsImported.push(id);
      cliLogger.info(`Report #${i++} - [${id}]`)
    }
    
    return reportsImported;
  },
};

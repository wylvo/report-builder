import validator from "validator";

import {
  mssql,
  mssqlDataTypes,
  config,
  dateISO8601,
  dateMSSharePoint,
  GlobalError,
} from "../router.js";
import reportSchema from "./report.schema.js";

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

// Check if the "incident.transaction" object is empty from a report
const isTransactionObjectEmpty = (transaction) =>
  Object.keys(transaction).length === 1 &&
  transaction.type &&
  transaction.type.length === 1 &&
  transaction.type[0] === ""
    ? true
    : false;

// Placeholder function to insert data into many to many SQL tables tied to reports
// Data is escaped to prevent SQL injection
const insertManyToMany = (array, reportId, mssql, insertFunction) => {
  if (!array || !Array.isArray(array) || array.length === 0) return;

  const rows = [],
    { Int } = mssqlDataTypes;

  array.forEach((value, i) => {
    const param = `param_${insertFunction.name}_${i}`;
    rows.push(insertFunction().row(param));

    // console.log("param:", param, typeof param, ", value:", value, typeof value);
    mssql.input(param, value);
  });

  mssql.input(`reportId_${insertFunction.name}`, Int, reportId);

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
  validation: {
    create: reportSchema.create,
    update: reportSchema.update,
    hardDelete: reportSchema.hardDelete,
    import: reportSchema.import,
  },

  // GET SINGLE REPORT BY ID
  async findById(id) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", Int, id)
      .output("report", NVarChar)
      .execute("api_v1_reports_getById");

    const report = JSON.parse(rawJSON);

    return report ? report : undefined;
  },

  // GET ALL REPORTS CREATED BY A USER, OR GET ALL SOFT DELETED REPORTS CREATED BY A USER
  async createdBy(userId, softDeleted = false) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("userId", Int, userId)
      .output("report", NVarChar)
      .execute(
        softDeleted
          ? "api_v1_reports_getCreatedByUserIdSoftDeleted"
          : "api_v1_reports_getCreatedByUserId"
      );

    const reports = JSON.parse(rawJSON);

    return !reports
      ? { results: 0, data: [] }
      : { results: reports.length, data: reports };
  },

  // SOFT DELETE SINGLE REPORT BY ID
  async softDelete(report) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", Int, report.id)
      .output("report", NVarChar)
      .execute("api_v1_reports_softDeleteById");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // UNDO SOFT DELETE SINGLE REPORT BY ID
  async undoSoftDelete(report) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", Int, report.id)
      .execute("api_V1_reports_softDeleteUndoById");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // GET ALL REPORTS, OR GET ALL SOFT DELETED REPORTS
  async all(softDeleted = false) {
    const { NVarChar } = mssqlDataTypes;
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.output("report", NVarChar)
      .execute(
        softDeleted
          ? "api_v1_reports_getAllSoftDeleted"
          : "api_v1_reports_getAll"
      );

    const reports = JSON.parse(rawJSON);

    return !reports
      ? { results: 0, data: [] }
      : { results: reports.length, data: reports };
  },

  // CREATE A NEW REPORT
  // prettier-ignore
  async create(body, createdByAndUpdatedBy, assignedTo, transaction) {
    const { NVarChar, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;
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

    if (body.store.numbers.includes("*"))
      body.store.numbers = config.validation.selects.storeNumbers.filter(sN => sN !== "*");
    if (body.incident.types.includes("*"))
      body.incident.types = config.validation.selects.incidentTypes.filter(iT => iT !== "*");
    if (body.incident.transaction.types.includes("*"))
      body.incident.transaction.types = config.validation.selects.incidentTransactionTypes.filter(iTT => iTT !== "*");

    const reportCreate = mssql(transaction).request;

    reportCreate.input("version", VarChar, body.version);
    reportCreate.input("createdBy", Int, body.createdBy);
    reportCreate.input("updatedBy", Int, body.updatedBy);
    reportCreate.input("assignedTo", Int, body.assignedTo);
    reportCreate.input("isOnCall", Bit, body.isOnCall);
    reportCreate.input("callDate", Date, body.call.date);
    reportCreate.input("callTime", Time, body.call.time);
    reportCreate.input("callDateTime", VarChar, body.call.dateTime);
    reportCreate.input("callPhone", VarChar, body.call.phone);
    reportCreate.input("callStatus", VarChar, body.call.status);
    reportCreate.input("storeEmployeeName", VarChar, body.store.employee.name);
    reportCreate.input("storeEmployeeIsStoreManager", Bit, body.store.employee.isStoreManager);
    reportCreate.input("incidentTitle", VarChar, body.incident.title);
    reportCreate.input("incidentPos", VarChar, body.incident.pos);
    reportCreate.input("incidentIsProcedural", Bit, body.incident.isProcedural);
    reportCreate.input("incidentError", VarChar, body.incident.error);
    reportCreate.input("incidentTransactionNumber", VarChar, body.incident.transaction.number);
    reportCreate.input("incidentTransactionHasVarianceReport", Bit, body.incident.transaction.hasVarianceReport);
    reportCreate.input("incidentDetails", VarChar, body.incident.details);

    const { output: { id: id } } = await reportCreate
      .output("id", Int)
      .execute("api_v1_reports_create");

    const queries = [
      insertManyToMany(body.store.numbers, id, reportCreate, this.insertStores),
      insertManyToMany(body.incident.types, id, reportCreate, this.insertIncidentTypes),
    ]
        
    if(body.incident.transaction.types) {
      queries.push(
        insertManyToMany(body.incident.transaction.types, id, reportCreate, this.insertIncidentTransactionTypes)
      )
    }

    await reportCreate.query(queries.join(" "));
    
    const {
      output: { report: rawJSON },
    } = await mssql(transaction)
      .request.input("id", Int, id)
      .output("report", NVarChar)
      .execute("api_v1_reports_getById");
      
    const reportCreated = JSON.parse(rawJSON);
    reportHasTransaction === false ? reportCreated.incident.transaction = {} : null;

    return reportCreated;
  },

  // UPDATE AN EXISTING REPORT
  // prettier-ignore
  async update(body, report, updatedBy, transaction) {
    const { NVarChar, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;
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

    reportUpdate.input("reportId", Int, report.id);
    reportUpdate.input("version", VarChar, body.version);
    reportUpdate.input("createdBy", VarChar, body.createdBy);
    reportUpdate.input("updatedBy", VarChar, body.updatedBy);
    reportUpdate.input("assignedTo", VarChar, body.assignedTo);
    reportUpdate.input("isOnCall", Bit, body.isOnCall);
    reportUpdate.input("isDeleted", Bit, body.isDeleted);
    reportUpdate.input("isWebhookSent", Bit, body.isWebhookSent);
    reportUpdate.input("hasTriggeredWebhook", Bit, body.hasTriggeredWebhook);
    reportUpdate.input("callDate", Date, body.call.date);
    reportUpdate.input("callTime", Time, body.call.time);
    reportUpdate.input("callDateTime", VarChar, body.call.dateTime);
    reportUpdate.input("callPhone", VarChar, body.call.phone);
    reportUpdate.input("callStatus", VarChar, body.call.status);
    reportUpdate.input("storeEmployeeName", VarChar, body.store.employee.name);
    reportUpdate.input("storeEmployeeIsStoreManager", Bit, body.store.employee.isStoreManager);
    reportUpdate.input("incidentTitle", VarChar, body.incident.title);
    reportUpdate.input("incidentPos", VarChar, body.incident.pos);
    reportUpdate.input("incidentIsProcedural", Bit, body.incident.isProcedural);
    reportUpdate.input("incidentError", VarChar, body.incident.error);
    reportUpdate.input("incidentTransactionNumber", VarChar, body.incident.transaction.number);
    reportUpdate.input("incidentTransactionHasVarianceReport", Bit, body.incident.transaction.hasVarianceReport);
    reportUpdate.input("incidentDetails", VarChar, body.incident.details);

    await reportUpdate.execute("api_v1_reports_update");

    await this.deleteStoresIncidentTypesIncidentTransactionTypes(report.id);

    const queries = [
      insertManyToMany(body.store.numbers, report.id, reportUpdate, this.insertStores),
      insertManyToMany(body.incident.types, report.id, reportUpdate, this.insertIncidentTypes),
    ]
        
    if(body.incident.transaction.types) {
      queries.push(
        insertManyToMany(body.incident.transaction.types, report.id, reportUpdate, this.insertIncidentTransactionTypes)
      )
    }

    await reportUpdate.query(queries.join(" "));

    const {
      output: { report: rawJSON },
    } = await mssql(transaction).request
      .input("id", Int, report.id)
      .output("report", NVarChar)
      .execute("api_v1_reports_getById");

    const reportUpdated = JSON.parse(rawJSON);
    reportHasTransaction === false ? reportUpdated.incident.transaction = {} : null;

    return reportUpdated;
  },

  // DELETE AN EXISTING REPORT **THIS ACTION IS IRREVERSIBLE**
  hardDelete(report, transaction) {
    const { Int } = mssqlDataTypes;
    return mssql(transaction)
      .request.input("reportId", Int, report.id)
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
    const { Int } = mssqlDataTypes;
    return mssql()
      .request.input("reportId", Int, reportId)
      .execute(
        "api_v1_reports_delete_store_incidentType_incidentTransactionType"
      );
  },

  // IMPORT REPORTS
  // prettier-ignore
  async import(body, transaction) {
    const { VarChar, Int, Bit, Date, Time, DateTimeOffset } = mssqlDataTypes;
    const reportsImported = [];

    let i = 0;
    for (const report of body) {
      console.log("Report:", i++);

      report.version = config.version;
      report.createdAt = dateISO8601(report.createdAt);
      report.updatedAt = dateISO8601(report.updatedAt);
      report.call.dateTime = dateMSSharePoint(
        `${report.call.date} ${report.call.time}`
      );
      if (!report.incident.transaction.types) report.incident.transaction = {};
      
      const reportImport = mssql(transaction).request;

      reportImport.input("version", VarChar, report.version);
      reportImport.input("createdAt", DateTimeOffset, report.createdAt);
      reportImport.input("updatedAt", DateTimeOffset, report.updatedAt);
      reportImport.input("createdBy", VarChar, report.createdBy);
      reportImport.input("updatedBy", VarChar, report.updatedBy);
      reportImport.input("assignedTo", VarChar, report.assignedTo);
      reportImport.input("isOnCall", Bit, report.isOnCall);
      reportImport.input("isDeleted", Bit, report.isDeleted);
      reportImport.input("isWebhookSent", Bit, report.isWebhookSent);
      reportImport.input("hasTriggeredWebhook", Bit, report.hasTriggeredWebhook);
      reportImport.input("callDate", Date, report.call.date);
      reportImport.input("callTime", Time, report.call.time);
      reportImport.input("callDateTime", VarChar, report.call.dateTime);
      reportImport.input("callPhone", VarChar, report.call.phone);
      reportImport.input("callStatus", VarChar, report.call.status);
      reportImport.input("storeEmployeeName", VarChar, report.store.employee.name);
      reportImport.input("storeEmployeeIsStoreManager", Bit, report.store.employee.isStoreManager);
      reportImport.input("incidentTitle", VarChar, report.incident.title);
      reportImport.input("incidentPos", VarChar, report.incident.pos);
      reportImport.input("incidentIsProcedural", Bit, report.incident.isProcedural);
      reportImport.input("incidentError", VarChar, report.incident.error);
      reportImport.input("incidentTransactionNumber", VarChar, report.incident.transaction.number);
      reportImport.input("incidentTransactionHasVarianceReport", Bit, report.incident.transaction.hasVarianceReport);
      reportImport.input("incidentDetails", VarChar, report.incident.details);

      const { output: { id } } =
        await reportImport
          .output("id", Int)
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
    }
    
    return reportsImported;
  },
};

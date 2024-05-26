import validator from "validator";

import {
  mssql,
  mssqlDataTypes,
  generateUUID,
  config,
  dateISO8601,
  dateMSSharePoint,
  GlobalError,
} from "../router.js";
import reportValidationSchema from "./reportValidationSchema.js";

// Custom validation to check if username exists in DB & and user is active
export { isValidUsername } from "../users/user.model.js";

// Custom validation to check if a JSON is not empty
export const isNotEmptyArray = (array) => array.length > 0;

// Custom validation to check if report exists in DB
export const isNewReport = async (value) => {
  const report = await Reports.findByUUID(value);
  if (report) throw new Error();
};

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

const isTransactionObjectEmpty = (transaction) =>
  Object.keys(transaction).length === 1 &&
  transaction.type &&
  transaction.type.length === 1 &&
  transaction.type[0] === ""
    ? true
    : false;

export const filterReportData = (data) => {
  const transaction = data.incident.transaction;
  if (isTransactionObjectEmpty(transaction)) data.incident.transaction = {};
  return Object.keys(data)
    .filter((key) => !["id"].includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});
};

export const filterReportArrayData = (data) => {
  const reports = [];
  if (data && Array.isArray(data))
    data.forEach((obj) => reports.push(filterReportData(obj)));
  return reports;
};

const insertManyToMany = (array, reportId, mssql, insert) => {
  if (!array || !Array.isArray(array) || array.length === 0) return;

  const params = {},
    rows = [];

  array.forEach((value, i) => {
    const param = "param_" + i;
    params[param] = value;
    rows.push(insert().row(param));
  });

  for (const [param, value] of Object.entries(params)) {
    // console.log("param:", param, typeof param, ", value:", value, typeof value);
    mssql.input(param, value);
  }
  mssql.input("reportId", reportId);

  return insert().query(rows);
};

export const Reports = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A REPORT        /api/v1/reports (POST)
   * UPDATING A REPORT        /api/v1/reports/:id (PUT)
   * HARD DELETING A REPORT   /api/v1/reports/:id (DELETE)
   **/
  schema: {
    create: reportValidationSchema.create,
    update: reportValidationSchema.update,
    hardDelete: reportValidationSchema.hardDelete,
  },

  async findByUUID(uuid) {
    const { NVarChar, UniqueIdentifier } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("uuid", UniqueIdentifier, uuid)
      .output("report", NVarChar)
      .execute("api_v1_reports_getByUUID");

    const report = JSON.parse(rawJSON);

    return report ? report : undefined;
  },

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

  async superPassword(userId, transaction = undefined) {
    const { Int, VarChar } = mssqlDataTypes;
    const request = transaction ? mssql(transaction).request : mssql().request;

    const {
      output: { hash: password },
    } = await request
      .input("userId", Int, userId)
      .output("hash", VarChar)
      .execute("api_v1_super_getPassword");

    return password;
  },

  async createdBy(userId) {
    const { NVarChar, Int } = mssqlDataTypes;

    return mssql()
      .request.input("userId", Int, userId)
      .output("report", NVarChar)
      .execute("api_v1_reports_getCreatedByUserId");
  },

  async softDeletedCreatedBy(userId) {
    const { NVarChar, Int } = mssqlDataTypes;

    return mssql()
      .request.input("userId", Int, userId)
      .output("report", NVarChar)
      .execute("api_v1_reports_getCreatedByUserIdSoftDeleted");
  },

  async softDelete(report) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", Int, report.id)
      .output("report", NVarChar)
      .execute("api_v1_reports_softDeleteById");

    const reportUpdated = JSON.parse(rawJSON);

    return filterReportData(reportUpdated);
  },

  async undoSoftDelete(report) {
    const { NVarChar, Int } = mssqlDataTypes;

    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("id", Int, report.id)
      .output("report", NVarChar)
      .execute("api_V1_reports_softDeleteUndoById");

    const reportUpdated = JSON.parse(rawJSON);

    return filterReportData(reportUpdated);
  },

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
      : { results: reports.length, data: filterReportArrayData(reports) };
  },

  // prettier-ignore
  async create(body, createdByAndUpdatedBy, assignedTo, transaction) {
    const { UniqueIdentifier, NVarChar, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;

    body.uuid = generateUUID();
    body.version = config.version;
    // Same user id for created by and updated by
    body.createdBy = createdByAndUpdatedBy;
    body.updatedBy = createdByAndUpdatedBy;
    body.assignedTo = assignedTo;
    body.call.dateTime = dateMSSharePoint(
      `${body.call.date} ${body.call.time}`
    );
    if (!body.incident.transaction.type) body.incident.transaction = {};

    const reportCreate = mssql(transaction).request;

    reportCreate.input("uuid", UniqueIdentifier, body.uuid);
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
    reportCreate.input("storeDistrictManagerIsContacted", Bit, body.store.districtManager.isContacted);
    reportCreate.input("incidentTitle", VarChar, body.incident.title);
    reportCreate.input("incidentPos", VarChar, body.incident.pos);
    reportCreate.input("incidentIsProcedural", Bit, body.incident.isProcedural);
    reportCreate.input("incidentError", VarChar, body.incident.error);
    reportCreate.input("incidentTransactionNumber", VarChar, body.incident.transaction.number);
    reportCreate.input("incidentTransactionIsIRCreated", Bit, body.incident.transaction.isIRCreated);
    reportCreate.input("incidentDetails", VarChar, body.incident.details);

    const { output: { id: id } } = await reportCreate
      .output("id", Int)
      .execute("api_v1_reports_create");

    const stores = mssql(transaction).request,
      incidentTypes = mssql(transaction).request,
      incidentTransactionTypes = mssql(transaction).request;

    const insertStores =
        insertManyToMany(body.store.number, id, stores, this.insertStores),
      insertIncidentTypes =
        insertManyToMany(body.incident.type, id, incidentTypes, this.insertIncidentTypes);
    
    await stores.query(insertStores);
    await incidentTypes.query(insertIncidentTypes);
    
    if(body.incident.transaction.type) {
      const insertIncidentTransactionTypes =
        insertManyToMany(body.incident.transaction.type, id, incidentTransactionTypes, this.insertIncidentTransactionTypes);
      await incidentTransactionTypes.query(insertIncidentTransactionTypes);
    }
    
    const {
      output: { report: rawJSON },
    } = await mssql(transaction)
      .request.input("id", Int, id)
      .output("report", NVarChar)
      .execute("api_v1_reports_getById");
      
    const reportCreated = JSON.parse(rawJSON);

    return filterReportData(reportCreated);
  },

  // prettier-ignore
  async update(body, report, updatedBy, transaction) {
    const { NVarChar, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;

    body.version = config.version;
    body.createdBy = report.createdBy;
    body.updatedBy = updatedBy;
    if(body.call.date !== report.call.date || body.call.time !== report.call.time)
      body.call.dateTime = dateMSSharePoint(
        `${body.call.date} ${body.call.time}`
      );
    if (!body.incident.transaction.type) body.incident.transaction = {};
    
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
    reportUpdate.input("storeDistrictManagerIsContacted", Bit, body.store.districtManager.isContacted);
    reportUpdate.input("incidentTitle", VarChar, body.incident.title);
    reportUpdate.input("incidentPos", VarChar, body.incident.pos);
    reportUpdate.input("incidentIsProcedural", Bit, body.incident.isProcedural);
    reportUpdate.input("incidentError", VarChar, body.incident.error);
    reportUpdate.input("incidentTransactionNumber", VarChar, body.incident.transaction.number);
    reportUpdate.input("incidentTransactionIsIRCreated", Bit, body.incident.transaction.isIRCreated);
    reportUpdate.input("incidentDetails", VarChar, body.incident.details);

    await reportUpdate.execute("api_v1_reports_update");

    await this.deleteStoresIncidentTypesIncidentTransactionTypes(report.id);

    const stores = mssql(transaction).request,
      incidentTypes = mssql(transaction).request,
      incidentTransactionTypes = mssql(transaction).request;

    const insertStores =
        insertManyToMany(body.store.number, report.id, stores, this.insertStores),
      insertIncidentTypes =
        insertManyToMany(body.incident.type, report.id, incidentTypes, this.insertIncidentTypes);
    
    await stores.query(insertStores);
    await incidentTypes.query(insertIncidentTypes);
    
    if(body.incident.transaction.type) {
      const insertIncidentTransactionTypes =
        insertManyToMany(body.incident.transaction.type, report.id, incidentTransactionTypes, this.insertIncidentTransactionTypes);
      await incidentTransactionTypes.query(insertIncidentTransactionTypes);
    }

    const {
      output: { report: rawJSON },
    } = await mssql(transaction).request
      .input("id", Int, report.id)
      .output("report", NVarChar)
      .execute("api_v1_reports_getById");

    const reportUpdated = JSON.parse(rawJSON);

    return filterReportData(reportUpdated);
  },

  hardDelete(report, transaction) {
    return mssql(transaction)
      .request.input("reportId", report.id)
      .execute("api_v1_reports_delete");
  },

  // prettier-ignore
  insertStores() {
    return {
      row: (param) =>
        `(@reportId, (SELECT id FROM stores WHERE number = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportStores (report_id, store_id) VALUES ${rows.join(", ")};`,
    };
  },

  // prettier-ignore
  insertIncidentTypes() {
    return {
      row: (param) =>
        `(@reportId, (SELECT id FROM incidentTypes WHERE type = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportIncidentTypes (report_id, incidentType_id) VALUES ${rows.join(", ")};`,
    };
  },

  // prettier-ignore
  insertIncidentTransactionTypes() {
    return {
      row: (param) =>
        `(@reportId, (SELECT id FROM incidentTransactionTypes WHERE type = ${"@" + param}))`,
      query: (rows) =>
        `INSERT INTO reportIncidentTransactionTypes (report_id, incidentTransactionType_id) VALUES ${rows.join(", ")};`,
    };
  },

  async deleteStoresIncidentTypesIncidentTransactionTypes(reportId) {
    const { Int } = mssqlDataTypes;
    return mssql()
      .request.input("reportId", Int, reportId)
      .execute(
        "api_v1_reports_delete_store_incidentType_incidentTransactionType"
      );
  },

  async import(body, createdByAndUpdatedBy, transaction) {
    const { UniqueIdentifier, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;

    req.body.version = config.version;
    req.body.createdBy = createdByAndUpdatedBy;
    req.body.updatedBy = createdByAndUpdatedBy;
    if (!body.incident.transaction.type) body.incident.transaction = {};

    const preparedStatement = mssql().preparedStatement;

    preparedStatement.input("uuid", UniqueIdentifier);
    preparedStatement.input("version", VarChar);
    preparedStatement.input("createdBy", Int);
    preparedStatement.input("updatedBy", Int);
    preparedStatement.input("assignedTo", Int);
    preparedStatement.input("isOnCall", Bit);
    preparedStatement.input("callDate", Date);
    preparedStatement.input("callTime", Time);
    preparedStatement.input("callDateTime", VarChar);
    preparedStatement.input("callPhone", VarChar);
    preparedStatement.input("callStatus", VarChar);
    preparedStatement.input("storeEmployeeName", VarChar);
    preparedStatement.input("storeEmployeeIsStoreManager", Bit);
    preparedStatement.input("storeDistrictManagerIsContacted", Bit);
    preparedStatement.input("incidentTitle", VarChar);
    preparedStatement.input("incidentPos", VarChar);
    preparedStatement.input("incidentIsProcedural", Bit);
    preparedStatement.input("incidentError", VarChar);
    preparedStatement.input("incidentTransactionNumber", VarChar);
    preparedStatement.input("incidentTransactionIsIRCreated", Bit);
    preparedStatement.input("incidentDetails", VarChar);

    await preparedStatement.prepare(`
      DECLARE @reportId INT;
      EXEC @reportId = [dbo].[api_v1_reports_create]
        @uuid = @uuid,
        @version = @version,
        @createdBy = @createdBy,
        @updatedBy = @updatedBy,
        @assignedTo = @assignedTo,
        @isOnCall = @isOnCall,
        @callDate = @callDate,
        @callTime = @callTime,
        @callDateTime = @callDateTime,
        @callPhone = @callPhone,
        @callStatus = @callStatus,
        @storeEmployeeName = @storeEmployeeName,
        @storeEmployeeIsStoreManager = @storeEmployeeIsStoreManager,
        @storeDistrictManagerIsContacted = @storeDistrictManagerIsContacted,
        @incidentTitle = @incidentTitle,
        @incidentPos = @incidentPos,
        @incidentIsProcedural = @incidentIsProcedural,
        @incidentError = @incidentError,
        @incidentTransactionNumber = @incidentTransactionNumber,
        @incidentTransactionIsIRCreated = @incidentTransactionIsIRCreated,
        @incidentDetails = @incidentDetails,
        @returnNewReport = 1;
    `);

    const {
      recordset: [report],
    } = await preparedStatement.execute({
      uuid: body.uuid,
      version: body.version,
      createdBy: body.createdBy,
      updatedBy: body.updatedBy,
      assignedTo: body.assignedTo,
      isOnCall: body.isOnCall,
      callDate: body.call.date,
      callTime: body.call.time,
      callDateTime: body.call.dateTime,
      callPhone: body.call.phone,
      callStatus: body.call.status,
      storeEmployeeName: body.store.employee.name,
      storeEmployeeIsStoreManager: body.store.employee.isStoreManager,
      storeDistrictManagerIsContacted: body.store.districtManager.isContacted,
      incidentTitle: body.incident.title,
      incidentPos: body.incident.pos,
      incidentIsProcedural: body.incident.isProcedural,
      incidentError: body.incident.error,
      incidentTransactionNumber: body.incident.transaction.number,
      incidentTransactionIsIRCreated: body.incident.transaction.isIRCreated,
      incidentDetails: body.incident.details,
    });

    await preparedStatement.unprepare();

    return report;
  },
};

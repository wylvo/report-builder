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
export { isValidUsername } from "../users/userModel.js";

// Custom validation to check if a JSON is not empty
export const isNotEmptyArray = (array) => array.length > 0;

// Custom validation to check if report exists in DB
export const isNewReport = async (value) => {
  const report = await Report.findByUUID(value);
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

export const Report = {
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
    const {
      recordset: [report],
    } = await mssql()
      .request.input("uuid", uuid)
      .execute("API_V1_getReportByUUID");

    return report ? report : undefined;
  },

  async findById(id) {
    const { Int } = mssqlDataTypes;
    const {
      recordset: [report],
    } = await mssql()
      .request.input("id", Int, id)
      .execute("API_V1_getReportById");

    return report ? report : undefined;
  },

  async superPassword() {
    const {
      recordset: [{ password }],
    } = await mssql().request.execute("API_V1_getSuperPassword");

    return password;
  },

  async createdBy(userId) {
    const { Int } = mssqlDataTypes;
    return mssql()
      .request.input("userId", Int, userId)
      .execute("API_V1_getReportsCreatedByUserId");
  },

  async softDeletedCreatedBy(userId) {
    const { Int } = mssqlDataTypes;
    return mssql()
      .request.input("userId", Int, userId)
      .execute("API_V1_getReportsSoftDeletedCreatedByUserId");
  },

  async all(softDeleted = false) {
    const {
      recordset: [reports],
    } = await mssql().request.execute(
      softDeleted ? "API_V1_getReportsSoftDeleted" : "API_V1_getReports"
    );

    return !reports
      ? { results: 0, data: [] }
      : { results: reports.length, data: filterReportArrayData(reports) };
  },

  async create(body, createdByAndUpdatedBy, assignedTo, transaction) {
    const { UniqueIdentifier, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;

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

    const report = mssql(transaction).request;

    report.input("uuid", UniqueIdentifier, body.uuid);
    report.input("version", VarChar, body.version);
    report.input("createdBy", Int, body.createdBy);
    report.input("updatedBy", Int, body.updatedBy);
    report.input("assignedTo", Int, body.assignedTo);
    report.input("isOnCall", Bit, body.isOnCall);
    report.input("callDate", Date, body.call.date);
    report.input("callTime", Time, body.call.time);
    report.input("callDateTime", VarChar, body.call.dateTime);
    report.input("callPhone", VarChar, body.call.phone);
    report.input("callStatus", VarChar, body.call.status);
    report.input("storeEmployeeName", VarChar, body.store.employee.name);
    // prettier-ignore
    report.input("storeEmployeeIsStoreManager", Bit, body.store.employee.isStoreManager);
    // prettier-ignore
    report.input("storeDistrictManagerIsContacted", Bit, body.store.districtManager.isContacted);
    report.input("incidentTitle", VarChar, body.incident.title);
    report.input("incidentPos", VarChar, body.incident.pos);
    report.input("incidentIsProcedural", Bit, body.incident.isProcedural);
    report.input("incidentError", VarChar, body.incident.error);
    // prettier-ignore
    report.input("incidentTransactionNumber", VarChar, body.incident.transaction.number);
    // prettier-ignore
    report.input("incidentTransactionIsIRCreated", Bit, body.incident.transaction.isIRCreated);
    report.input("incidentDetails", VarChar, body.incident.details);
    report.input("returnNewReport", Bit, 0);

    const { returnValue: reportId } = await report.execute(
      "API_V1_createReport"
    );

    const stores = mssql(transaction).request;
    const insertStores = insertManyToMany(
      body.store.number,
      reportId,
      stores,
      this.insertStores
    );
    await stores.query(insertStores);

    const incTypes = mssql(transaction).request;
    const insertIncTypes = insertManyToMany(
      body.incident.type,
      reportId,
      incTypes,
      this.insertIncidentTypes
    );
    await incTypes.query(insertIncTypes);

    const incTxnTypes = mssql(transaction).request;
    const insertIncTxnTypes = insertManyToMany(
      body.incident.transaction.type,
      reportId,
      incTxnTypes,
      this.insertIncidentTransactionTypes
    );
    await incTxnTypes.query(insertIncTxnTypes);

    const getNewReport = mssql(transaction).request;

    const {
      recordset: [reportCreated],
    } = await getNewReport
      .input("id", Int, reportId)
      .execute("API_V1_getReportById");

    return filterReportData(reportCreated);
  },

  async update(body, report, updatedBy) {
    const { NVarChar } = mssqlDataTypes;

    body.version = config.version;
    body.createdAt = report.createdAt;
    body.updatedAt = dateISO8601(new Date());
    body.createdBy = report.createdBy;
    body.updatedBy = updatedBy;
    body.call.dateTime = dateMSSharePoint(
      `${body.call.date} ${body.call.time}`
    );

    const rawJSON = JSON.stringify([body]);
    const {
      insertStores,
      insertIncidentTypes,
      insertIncidentTransactionTypes,
    } = insertManyToMany(body);
    const update = this.query.update(
      insertStores,
      insertIncidentTypes,
      insertIncidentTransactionTypes
    );

    console.log(update);

    const {
      recordset: [[reportUpdated]],
    } = await mssql()
      .request.input("id", report.id)
      .input("rawJSON", NVarChar, rawJSON)
      .query(update);

    return filterReportData(reportUpdated);
  },

  async hardDelete(report) {
    return await mssql("transaction")
      .input("id", report.id)
      .query(this.query.delete);
  },

  async softDelete(report) {
    const {
      recordset: [reportUpdated],
    } = await mssql()
      .request.input("id", report.id)
      .execute("API_V1_softDeleteReportById");

    return filterReportData(reportUpdated);
  },

  async undoSoftDelete(report) {
    const {
      recordset: [reportUpdated],
    } = await mssql()
      .request.input("id", report.id)
      .execute("API_V1_undoSoftDeleteReportById");

    return filterReportData(reportUpdated);
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

  /**
   *  ALL MS SQL SERVER QUERIES RELATED TO REPORTS
   **/
  query: {
    withClause: `
      uuid VARCHAR(36) 'strict $.uuid',
      version VARCHAR(255) 'strict $.version',
      createdAt DATETIMEOFFSET 'strict $.createdAt',
      updatedAt DATETIMEOFFSET 'strict $.updatedAt',
      createdBy VARCHAR(20) 'strict $.createdBy',
      updatedBy VARCHAR(20) 'strict $.updatedBy',
      assignedTo VARCHAR(20) 'strict $.assignedTo',
      isOnCall BIT 'strict $.isOnCall',
      isDeleted BIT '$.isDeleted',
      isWebhookSent BIT '$.isWebhookSent',
      hasTriggeredWebhook BIT '$.hasTriggeredWebhook',
      callDate DATE 'strict $.call.date',
      callTime TIME 'strict $.call.time',
      callDateTime VARCHAR(20) 'strict $.call.dateTime',
      callPhone VARCHAR(20) 'strict $.call.phone',
      callStatus VARCHAR(100) 'strict $.call.status',
      storeEmployeeName VARCHAR(100) 'strict $.store.employee.name',
      storeEmployeeIsStoreManager BIT 'strict $.store.employee.isStoreManager',
      storeDistrictManagerIsContacted BIT 'strict $.store.districtManager.isContacted',
      incidentTitle VARCHAR(100) 'strict $.incident.title',
      incidentPos VARCHAR(2) 'strict $.incident.pos',
      incidentIsProcedural BIT 'strict $.incident.isProcedural',
      incidentError VARCHAR(100) 'strict $.incident.error',
      incidentTransactionNumber VARCHAR(100) '$.incident.transaction.number',
      incidentTransactionIsIRCreated BIT '$.incident.transaction.isIRCreated',
      incidentDetails VARCHAR(2000) 'strict $.incident.details'
    `,

    byId() {
      return `
        SELECT * FROM dbo.getReportById(@id)
        FOR JSON PATH;
      `;
    },

    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update(insertStores, insertIncidentTypes, insertIncidentTransactionTypes) {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE reports
        SET uuid = json.uuid,
          version = json.version,
          createdAt = json.createdAt,
          updatedAt = json.updatedAt,
          createdBy = (SELECT id FROM users WHERE username = json.createdBy),
          updatedBy = (SELECT id FROM users WHERE username = json.updatedBy),
          assignedTo = (SELECT id FROM users WHERE username = json.assignedTo),
          isOnCall = json.isOnCall,
          isDeleted = json.isDeleted,
          isWebhookSent = json.isWebhookSent,
          hasTriggeredWebhook = json.hasTriggeredWebhook,
          callDate = json.callDate,
          callTime = json.callTime,
          callDateTime = json.callDateTime,
          callPhone = json.callPhone,
          callStatus = json.callStatus,
          storeEmployeeName = json.storeEmployeeName,
          storeEmployeeIsStoreManager = json.storeEmployeeIsStoreManager,
          storeDistrictManagerIsContacted = json.storeDistrictManagerIsContacted,
          incidentTitle = json.incidentTitle,
          incidentPos = json.incidentPos,
          incidentIsProcedural = json.incidentIsProcedural,
          incidentError = json.incidentError,
          incidentTransactionNumber = json.incidentTransactionNumber,
          incidentTransactionIsIRCreated = json.incidentTransactionIsIRCreated,
          incidentDetails = json.incidentDetails
        FROM OPENJSON(@json)
        WITH (
          ${this.withClause}
        ) AS json
        WHERE reports.id = @id;

        DELETE FROM reportStores
        WHERE reportStores.report_id = @id;

        DELETE FROM reportIncidentTypes
        WHERE reportIncidentTypes.report_id = @id;

        DELETE FROM reportIncidentTransactionTypes
        WHERE reportIncidentTransactionTypes.report_id = @id;

        ${insertStores}
        ${insertIncidentTypes}
        ${insertIncidentTransactionTypes}

        ${this.byId()}
      `;
    },

    delete: `
      DELETE FROM reportStores
      WHERE reportStores.report_id = @id;

      DELETE FROM reportIncidentTypes
      WHERE reportIncidentTypes.report_id = @id;

      DELETE FROM reportIncidentTransactionTypes
      WHERE reportIncidentTransactionTypes.report_id = @id;

      DELETE FROM reports WHERE id = @id;
    `,
  },

  async import(body, createdByAndUpdatedBy, transaction) {
    const { UniqueIdentifier, VarChar, Int, Bit, Date, Time } = mssqlDataTypes;

    req.body.version = config.version;
    req.body.createdBy = createdByAndUpdatedBy;
    req.body.updatedBy = createdByAndUpdatedBy;
    if (!body.incident.transaction.type) body.incident.transaction = {};

    const preparedStatement = mssql("preparedStatement", transaction);

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
      EXEC @reportId = [dbo].[API_V1_createReport]
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

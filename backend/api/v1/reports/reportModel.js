import validator from "validator";

import {
  mssql,
  mssqlDataTypes,
  generateUUID,
  config,
  dateISO8601,
  dateMSSharePoint,
} from "../router.js";
import reportValidationSchema from "./reportValidationSchema.js";

// Custom validation to check if username exists in DB & and user is active
export { isValidUsername } from "../users/userModel.js";

// Custom validation to check if a JSON is not empty
export const isNotEmptyArray = (array) => array.length > 0;

// Custom validation to check if report exists in DB
export const isNewReport = async (value) => {
  const [report] = await Report.findByUUID(value);
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

const insertManyToMany = (body) => ({
  insertStores: Report.query.insertStores(body.store.number),
  insertIncidentTypes: Report.query.insertIncidentTypes(body.incident.type),
  insertIncidentTransactionTypes: body.incident.transaction.type
    ? Report.query.insertIncidentTransactionTypes(
        body.incident.transaction.type
      )
    : "",
});

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
    } = await mssql().input("uuid", uuid).query(this.query.byUUID());

    return report ? report : [];
  },

  async findById(id) {
    const {
      recordset: [report],
    } = await mssql().input("id", id).query(this.query.byId());

    return report ? filterReportData(report[0]) : [];
  },

  async superPassword() {
    const {
      recordset: [{ password }],
    } = await mssql().query(this.query.getSuperPassword);

    return password;
  },

  async createdBy(userId) {
    return mssql().input("userId", userId).query(this.query.byCreatedBy());
  },

  async createdBySoftDeleted(userId) {
    return mssql()
      .input("userId", userId)
      .query(this.query.byCreatedBySoftDeleted());
  },

  async all(softDeleted = false) {
    const {
      recordset: [reports],
    } = await mssql().query(
      softDeleted ? this.query.allSoftDeleted() : this.query.all()
    );

    return !reports
      ? { results: 0, data: [] }
      : { results: reports.length, data: filterReportArrayData(reports) };
  },

  async create(body, createdBy, updatedBy, assignedTo) {
    const { NVarChar } = mssqlDataTypes;

    body.uuid = generateUUID();
    body.version = config.version;
    body.createdAt = dateISO8601(new Date());
    body.updatedAt = dateISO8601(new Date());
    body.createdBy = createdBy;
    body.updatedBy = updatedBy;
    body.assignedTo = assignedTo;
    body.isDeleted = false;
    body.isWebhookSent = false;
    body.hasTriggeredWebhook = false;
    body.call.dateTime = dateMSSharePoint(
      `${body.call.date} ${body.call.time}`
    );
    if (!body.incident.transaction.type) body.incident.transaction = {};

    const rawJSON = JSON.stringify([body]);
    const {
      insertStores,
      insertIncidentTypes,
      insertIncidentTransactionTypes,
    } = insertManyToMany(body);
    const insert = this.query.insert(
      insertStores,
      insertIncidentTypes,
      insertIncidentTransactionTypes
    );

    const {
      recordset: [[report]],
    } = await mssql()
      .input("rawJSON", NVarChar, rawJSON)
      .input("uuid", body.uuid)
      .query(insert);

    return filterReportData(report);
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
      .input("id", report.id)
      .input("rawJSON", NVarChar, rawJSON)
      .query(update);

    return filterReportData(reportUpdated);
  },

  async hardDelete(report) {
    return await mssql().input("id", report.id).query(this.query.delete);
  },

  async softDelete(report) {
    return await mssql().input("id", report.id).query(this.query.softDelete);
  },

  async undoSoftDelete(report) {
    const {
      recordset: [[reportUpdated]],
    } = await mssql().input("id", report.id).query(this.query.undoSoftDelete());

    return filterReportData(reportUpdated);
  },

  /**
   *  ALL MS SQL SERVER QUERIES RELATED TO REPORTS
   **/
  query: {
    // Source: https://learn.microsoft.com/en-us/sql/relational-databases/json/format-query-results-as-json-with-for-json-sql-server?view=sql-server-ver16&redirectedfrom=MSDN&tabs=json-path
    // Source: https://learn.microsoft.com/en-us/sql/relational-databases/json/convert-json-data-to-rows-and-columns-with-openjson-sql-server?view=sql-server-ver16
    JSONSelect: `
      r.id AS [id],
      r.uuid AS [uuid],
      version AS [version],
      r.createdAt AS [createdAt],
      r.updatedAt AS [updatedAt],
      usr1.username AS [createdBy],
      usr2.username AS [updatedBy],
      usr3.username AS [assignedTo],
      isOnCall AS [isOnCall],
      isDeleted AS [isDeleted],
      isWebhookSent AS [isWebhookSent],
      hasTriggeredWebhook AS [hasTriggeredWebhook],
  
      callDate AS [call.date],
      callTime AS [call.time],
      callDateTime AS [call.dateTime],
      callPhone AS [call.phone],
      callStatus AS [call.status],
  
      -- SELECT DISTINCT store numbers into one single JSON array
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.number'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON(
            (
              SELECT s.number
              FROM stores s
              JOIN reportStores rS ON rS.report_id = r.id AND rS.store_id = s.id
              FOR JSON PATH
            )
          ) AS j
          GROUP BY value
        ) j
      ) AS [store.number],
      storeEmployeeName AS [store.employee.name],
      storeEmployeeIsStoreManager AS [store.employee.isStoreManager],
    
      -- SELECT DISTINCT district manager full names into one single JSON array
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.fullName'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON(
            (
              SELECT dM.fullName
              FROM districtManagers dM
              JOIN reportStores rS ON rS.report_id = r.id
              JOIN stores s ON s.id = rS.store_id AND s.districtManager_id = dM.id
              FOR JSON PATH
            )
          ) AS j
          GROUP BY value
        ) j
      ) AS [store.districtManager.name],
        
      -- SELECT DISTINCT district manager usernames into one single JSON array
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.username'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON(
            (
              SELECT dM.username
              FROM districtManagers dM
              JOIN reportStores rS ON rS.report_id = r.id
              JOIN stores s ON s.id = rS.store_id AND s.districtManager_id = dM.id
              FOR JSON PATH
            )
          ) AS j
          GROUP BY value
        ) j
      ) AS [store.districtManager.username],
      storeDistrictManagerIsContacted AS [store.districtManager.isContacted],

      incidentTitle AS [incident.title],

      -- SELECT DISTINCT incident types into one single JSON array
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON(
            (
              SELECT iT.type
              FROM incidentTypes iT
              JOIN reportIncidentTypes rIT ON rIT.report_id = r.id AND iT.id = rIT.incidentType_id
              FOR JSON PATH
            )
          ) AS j
          GROUP BY value
        ) j
      ) AS [incident.type],

      incidentPos AS [incident.pos],
      incidentIsProcedural AS [incident.isProcedural],
      incidentError AS [incident.error],

      -- SELECT DISTINCT incident transaction types into one single JSON array
      (
        SELECT 
          JSON_QUERY(CONCAT('["',STRING_AGG(JSON_VALUE(value, '$.type'), '","'),'"]'))
        FROM (
          SELECT value
          FROM OPENJSON(
            (
              SELECT iTT.type
              FROM incidentTransactionTypes iTT
              JOIN reportIncidentTransactionTypes rITT ON rITT.report_id = r.id AND iTT.id = rITT.incidentTransactionType_id
              FOR JSON PATH
            )
          ) AS j
          GROUP BY value
        ) j
      ) AS [incident.transaction.type],

      incidentTransactionNumber AS [incident.transaction.number],
      incidentTransactionIsIRCreated AS [incident.transaction.isIRCreated],
      incidentDetails AS [incident.details]
    `,

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

    byUUID() {
      return `
        SELECT
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.uuid = @uuid
        FOR JSON PATH;
      `;
    },

    byId() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.id = @id
        FOR JSON PATH;
      `;
    },

    byCreatedBy() {
      return `
        SELECT
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 0 AND r.createdBy = @userId
        ORDER BY r.createdAt DESC
        FOR JSON PATH;
      `;
    },

    byCreatedBySoftDeleted() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 1 AND r.createdBy = @userId
        ORDER BY r.updatedAt DESC
        FOR JSON PATH;
      `;
    },

    all() {
      return `
        SELECT
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 0
        ORDER BY r.createdAt DESC
        FOR JSON PATH;
      `;
    },

    allSoftDeleted() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 1
        ORDER BY updatedAt DESC
        FOR JSON PATH;
      `;
    },

    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    insert(insertStores, insertIncidentTypes, insertIncidentTransactionTypes) {
      return `
        INSERT INTO
          reports
        SELECT
          *
        FROM OPENJSON(@rawJSON)
        WITH (
          ${this.withClause}
        );

        DECLARE @id INT = SCOPE_IDENTITY()

        ${insertStores}
        ${insertIncidentTypes}
        ${insertIncidentTransactionTypes}

        SELECT
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.id = @id
        FOR JSON PATH;
      `;
    },

    insertStores(numbers) {
      return `
        INSERT INTO
          reportStores (report_id, store_id)
        VALUES
          ${numbers
            .map((n) => `(@id, (SELECT id FROM stores WHERE number = '${n}'))`)
            .join(",")};
      `;
    },

    insertIncidentTypes(types) {
      return `
        INSERT INTO
          reportIncidentTypes (report_id, incidentType_id)
        VALUES
          ${types
            .map(
              (t) => `(@id, (SELECT id FROM incidentTypes WHERE type = '${t}'))`
            )
            .join(",")};
      `;
    },

    insertIncidentTransactionTypes(types) {
      return `
        INSERT INTO
          reportIncidentTransactionTypes (report_id, incidentTransactionType_id)
        VALUES
          ${types
            .map(
              (t) =>
                `(@id, (SELECT id FROM incidentTransactionTypes WHERE type = '${t}'))`
            )
            .join(",")};
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

    softDelete: `
      UPDATE reports
      SET isDeleted = 1,
      updatedAt = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
      WHERE id = @id;
    `,

    undoSoftDelete() {
      return `
        UPDATE reports
        SET isDeleted = 0,
        updatedAt = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE id = @id;

        ${this.byId()}
      `;
    },

    getSuperPassword: "SELECT password FROM super;",
  },
};

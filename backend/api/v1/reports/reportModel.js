import validator from "validator";

import { mssql } from "../router.js";
import reportValidationSchema from "./reportValidationSchema.js";

// Custom validation to check if username exists in DB & and user is active
export { isValidUsername } from "../users/userModel.js";

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

  findBy: async (input, value, query) => {
    const {
      recordset: [report],
    } = await mssql().input(input, value).query(query);

    return report ? report : [];
  },

  findByUUID: async (uuid) => {
    const {
      recordset: [report],
    } = await mssql().input("uuid", uuid).query(Report.query.byUUID());

    return report ? report : [];
  },

  findById: async (id) => {
    const {
      recordset: [report],
    } = await mssql().input("id", id).query(Report.query.byId());

    return report ? report : [];
  },

  superPassword: async () => {
    const {
      recordset: [{ password }],
    } = await mssql().query(Report.query.getSuperPassword);

    return password;
  },

  /**
   *  ALL MS SQL SERVER QUERIES RELATED TO REPORTS
   **/
  query: {
    dataArrays: `
      -- Tables that contain different column values will produce duplicate rows on JOINs for the same report id
      -- These JSON array variables will concatenate all the distinct same-column data into 1 final JSON array.
      DECLARE @storeNumbers NVARCHAR(MAX) = N'[]'
      DECLARE @dmFullNames NVARCHAR(MAX) = N'[]'
      DECLARE @dmUsernames NVARCHAR(MAX) = N'[]'
      DECLARE @incidentTypes NVARCHAR(MAX) = N'[]'
      DECLARE @incidentTransactionTypes NVARCHAR(MAX) = N'[]'
      
      -- Join store numbers, district manager full names & usernames, incident types, and incident transaction types
      DECLARE @data NVARCHAR(MAX) = (
        SELECT
          number = s.number,
          dmFullName = dM.fullName,
          dmUsername = dM.username,
          incidentType = iT.type,
          incidentTxnType = iTT.type
        FROM reports r
        JOIN reportStores rS ON rS.report_id = r.id
        JOIN stores s ON s.id = rS.store_id
        JOIN districtManagers dM ON dM.id = s.districtManager_id
        JOIN reportIncidentTypes rIT ON rIT.report_id = r.id
        JOIN incidentTypes iT ON iT.id = rIT.incidentType_id
        JOIN reportIncidentTransactionTypes rITT ON rITT.report_id = r.id
        JOIN incidentTransactionTypes iTT ON iTT.id = rITT.incidentTransactionType_id
        WHERE r.id = @id
        FOR JSON PATH
      );
      
      -- Append the relevant joined data each into their separate variables (JSON arrays)
      SELECT
        @storeNumbers = JSON_MODIFY(@storeNumbers, 'append $', [data].number),
        @dmFullNames = JSON_MODIFY(@dmFullNames, 'append $', [data].dmFullName),
        @dmUsernames = JSON_MODIFY(@dmUsernames, 'append $', [data].dmUsername),
        @incidentTypes = JSON_MODIFY(@incidentTypes, 'append $', [data].incidentType),
        @incidentTransactionTypes = JSON_MODIFY(@incidentTransactionTypes, 'append $', [data].incidentTxnType)
      FROM OPENJSON(@data)
      WITH (
        number VARCHAR(4) '$."number"',
        item VARCHAR(4) '$."_"',
        dmFullName VARCHAR(100) '$."dmFullName"',
        dmUsername VARCHAR(20) '$."dmUsername"',
        incidentType VARCHAR(100) '$."incidentType"',
        incidentTxnType VARCHAR(100) '$."incidentTxnType"'
      ) AS [data]
    `,

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

      -- Filter duplicate values from @storeNumbers
      (SELECT JSON_QUERY(
        (
          SELECT 
            CONCAT('["',STRING_AGG(value, '","'),'"]')
          FROM (
            SELECT value
            FROM OPENJSON(@storeNumbers) AS j
            GROUP BY value
          ) j
        )
      )) AS [store.number],
        storeEmployeeName AS [store.employee.name],
        storeEmployeeIsStoreManager AS [store.employee.isStoreManager],

      -- Filter duplicate values from @dmFullNames
      (SELECT JSON_QUERY(
        (
          SELECT 
            CONCAT('["',STRING_AGG(value, '","'),'"]')
          FROM (
            SELECT value
            FROM OPENJSON(@dmFullNames) AS j
            GROUP BY value
          ) j
        )
      )) AS [store.districtManager.name],
      
      -- Filter duplicate values from @dmUsernames
      (SELECT JSON_QUERY(
        (
          SELECT 
            CONCAT('["',STRING_AGG(value, '","'),'"]')
          FROM (
            SELECT value
            FROM OPENJSON(@dmUsernames) AS j
            GROUP BY value
          ) j
        )
      )) AS [store.districtManager.username],
        storeDistrictManagerIsContacted AS [store.districtManager.isContacted],

        incidentTitle AS [incident.title],

      -- Filter duplicate values from @incidentTypes
        (SELECT JSON_QUERY(
        (
          SELECT 
            CONCAT('["',STRING_AGG(value, '","'),'"]')
          FROM (
            SELECT value
            FROM OPENJSON(@incidentTypes) AS j
            GROUP BY value
          ) j
        )
      )) AS [incident.type],

        incidentPos AS [incident.pos],
        incidentIsProcedural AS [incident.isProcedural],
        incidentError AS [incident.error],

      -- Filter duplicate values from @incidentTransactionTypes
        (SELECT JSON_QUERY(
        (
          SELECT 
            CONCAT('["',STRING_AGG(value, '","'),'"]')
          FROM (
            SELECT value
            FROM OPENJSON(@incidentTransactionTypes) AS j
            GROUP BY value
          ) j
        )
      )) AS [incident.transaction.type],

      incidentTransactionNumber AS [incident.transaction.number],
      incidentTransactionIsIRCreated AS [incident.transaction.isIRCreated],
      incidentDetails AS [incident.details]
    `,

    withClause: `
      uuid VARCHAR(36) 'strict $.uuid',
      version VARCHAR(64) 'strict $.version',
      createdAt DATETIMEOFFSET 'strict $.createdAt',
      updatedAt DATETIMEOFFSET 'strict $.updatedAt',
      createdBy VARCHAR(20) 'strict $.createdBy',
      updatedBy VARCHAR(20) 'strict $.updatedBy',
      assignedTo VARCHAR(20) 'strict $.assignedTo',
      isOnCall BIT 'strict $.isOnCall',
      isDeleted BIT 'strict $.isDeleted',
      isWebhookSent BIT 'strict $.isWebhookSent',
      hasTriggeredWebhook BIT 'strict $.hasTriggeredWebhook',
      callDate DATE 'strict $.call.date',
      callTime TIME 'strict $.call.time',
      callDateTime VARCHAR(64) 'strict $.call.dateTime',
      callPhone VARCHAR(64) 'strict $.call.phone',
      callStatus VARCHAR(64) 'strict $.call.status',
      storeNumber VARCHAR(3) 'strict $.store.number',
      storeEmployeeName VARCHAR(50) 'strict $.store.employee.name',
      storeEmployeeIsStoreManager BIT 'strict $.store.employee.isStoreManager',
      storeDistrictManagerName VARCHAR(50) 'strict $.store.districtManager.name',
      storeDistrictManagerUsername VARCHAR(20) 'strict $.store.districtManager.username',
      storeDistrictManagerIsContacted BIT 'strict $.store.districtManager.isContacted',
      incidentTitle VARCHAR(100) 'strict $.incident.title',
      incidentType VARCHAR(64) 'strict $.incident.type',
      incidentPos VARCHAR(1) 'strict $.incident.pos',
      incidentIsProcedural BIT 'strict $.incident.isProcedural',
      incidentError VARCHAR(100) 'strict $.incident.error',
      incidentTransactionType VARCHAR(64) '$.incident.transaction.type',
      incidentTransactionNumber VARCHAR(50) '$.incident.transaction.number',
      incidentTransactionIsIRCreated BIT '$.incident.transaction.isIRCreated',
      incidentDetails VARCHAR(2000) 'strict $.incident.details',
      rawJSON NVARCHAR(MAX) '$' AS JSON
    `,

    byUUID() {
      return `
        ${this.dataArrays}
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
        ${this.dataArrays}
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

    // TODO: REFACTOR AFTER SETTING UP DB RELATIONSHIPS
    byUsername() {
      return `
        ${this.dataArrays}
        SELECT
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 0 AND r.assignedTo = @username
        ORDER BY r.createdAt DESC
        FOR JSON PATH;
      `;
    },

    // TODO: REFACTOR AFTER SETTING UP DB RELATIONSHIPS
    byUsernameSoftDeleted() {
      return `
        ${this.dataArrays}
        SELECT 
          ${this.JSONSelect}
        FROM reports r
        JOIN users usr1 ON usr1.id = r.createdBy
        JOIN users usr2 ON usr2.id = r.updatedBy
        JOIN users usr3 ON usr3.id = r.assignedTo
        WHERE r.isDeleted = 1 AND r.assignedTo = @username
        ORDER BY r.updatedAt DESC
        FOR JSON PATH;
      `;
    },

    all() {
      return `
        ${this.dataArrays}
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
        ${this.dataArrays}
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
    insert() {
      return `
        INSERT INTO
          reports
        SELECT
          *
        FROM OPENJSON(@rawJSON)
        WITH (
          ${this.withClause}
        );

        SELECT
          ${this.JSONSelect}
        FROM reports
        WHERE uuid = @uuid
        FOR JSON PATH;
      `;
    },

    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update() {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE reports
        SET uuid = json.uuid,
          version = json.version,
          createdAt = json.createdAt,
          updatedAt = json.updatedAt,
          createdBy = json.createdBy,
          updatedBy = json.updatedBy,
          assignedTo = json.assignedTo,
          isOnCall = json.isOnCall,
          isDeleted = json.isDeleted,
          isWebhookSent = json.isWebhookSent,
          hasTriggeredWebhook = json.hasTriggeredWebhook,
          callDate = json.callDate,
          callTime = json.callTime,
          callDateTime = json.callDateTime,
          callPhone = json.callPhone,
          callStatus = json.callStatus,
          storeNumber = json.storeNumber,
          storeEmployeeName = json.storeEmployeeName,
          storeEmployeeIsStoreManager = json.storeEmployeeIsStoreManager,
          storeDistrictManagerName = json.storeDistrictManagerName,
          storeDistrictManagerUsername = json.storeDistrictManagerUsername,
          storeDistrictManagerIsContacted = json.storeDistrictManagerIsContacted,
          incidentTitle = json.incidentTitle,
          incidentType = json.incidentType,
          incidentPos = json.incidentPos,
          incidentIsProcedural = json.incidentIsProcedural,
          incidentError = json.incidentError,
          incidentTransactionType = json.incidentTransactionType,
          incidentTransactionNumber = json.incidentTransactionNumber,
          incidentTransactionIsIRCreated = json.incidentTransactionIsIRCreated,
          incidentDetails = json.incidentDetails,
          rawJSON = json.rawJSON
        FROM OPENJSON(@json)
        WITH (
          ${this.withClause}
        ) AS json
        WHERE reports.id = @id;

        ${this.byId()}
      `;
    },

    delete: "DELETE FROM reports WHERE id = @id;",

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

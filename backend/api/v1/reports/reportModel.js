import validator from "validator";

import { mssql } from "../router.js";
import reportValidationSchema from "./reportValidationSchema.js";

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
    update: reportValidationSchema.update(),
    hardDelete: reportValidationSchema.hardDelete,
  },

  findBy: async (input, value, query) => {
    const {
      recordset: [report],
    } = await mssql().input(input, value).query(query);

    return report;
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
    // Source: https://learn.microsoft.com/en-us/sql/relational-databases/json/format-query-results-as-json-with-for-json-sql-server?view=sql-server-ver16&redirectedfrom=MSDN&tabs=json-path
    // Source: https://learn.microsoft.com/en-us/sql/relational-databases/json/convert-json-data-to-rows-and-columns-with-openjson-sql-server?view=sql-server-ver16
    JSONSelect: `
      id AS [id],
      version AS [version],
      createdDateTime AS [createdDateTime],
      lastModifiedDateTime AS [lastModifiedDateTime],
      createdBy AS [createdBy],
      updatedBy AS [updatedBy],
      isDeleted AS [isDeleted],
      isWebhookSent AS [isWebhookSent],
      hasTriggeredWebhook AS [hasTriggeredWebhook],
      callDate AS [call.date],
      callTime AS [call.time],
      callDateTime AS [call.dateTime],
      callPhone AS [call.phone],
      callStatus AS [call.status],
      storeNumber AS [store.number],
      storeEmployeeName AS [store.employee.name],
      storeEmployeeIsStoreManager AS [store.employee.isStoreManager],
      storeDistrictManagerName AS [store.districtManager.name],
      storeDistrictManagerUsername AS [store.districtManager.username],
      storeDistrictManagerIsContacted AS [store.districtManager.isContacted],
      incidentTitle AS [incident.title],
      incidentDate AS [incident.date],
      incidentTime AS [incident.time],
      incidentDateTime AS [incident.dateTime],
      incidentCopyTimestamp AS [incident.copyTimestamp],
      incidentType AS [incident.type],
      incidentPos AS [incident.pos],
      incidentIsProcedural AS [incident.isProcedural],
      incidentError AS [incident.error],
      incidentTransactionType AS [incident.transaction.type],
      incidentTransactionNumber AS [incident.transaction.number],
      incidentTransactionIsIRCreated AS [incident.transaction.isIRCreated],
      incidentDetails AS [incident.details],
      techName AS [tech.name],
      techUsername AS [tech.username],
      techInitials AS [tech.initials],
      techIsOnCall AS [tech.isOnCall]
    `,

    withClause: `
      id VARCHAR(36) 'strict $.id',
      version VARCHAR(64) 'strict $.version',
      createdDateTime DATETIMEOFFSET 'strict $.createdDateTime',
      lastModifiedDateTime DATETIMEOFFSET '$.lastModifiedDateTime',
      createdBy VARCHAR(64) 'strict $.createdBy',
      updatedBy VARCHAR(64) '$.updatedBy',
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
      incidentDate DATE 'strict $.incident.date',
      incidentTime TIME 'strict $.incident.time',
      incidentDateTime VARCHAR(64) 'strict $.incident.dateTime',
      incidentCopyTimestamp BIT 'strict $.incident.copyTimestamp',
      incidentType VARCHAR(64) 'strict $.incident.type',
      incidentPos VARCHAR(1) 'strict $.incident.pos',
      incidentIsProcedural BIT 'strict $.incident.isProcedural',
      incidentError VARCHAR(100) 'strict $.incident.error',
      incidentTransactionType VARCHAR(64) '$.incident.transaction.type',
      incidentTransactionNumber VARCHAR(50) '$.incident.transaction.number',
      incidentTransactionIsIRCreated BIT '$.incident.transaction.isIRCreated',
      incidentDetails VARCHAR(2000) 'strict $.incident.details',
      techName VARCHAR(64) 'strict $.tech.name',
      techUsername VARCHAR(20) 'strict $.tech.username',
      techInitials VARCHAR(2) 'strict $.tech.initials',
      techIsOnCall BIT 'strict $.tech.isOnCall',
      rawJSON NVARCHAR(MAX) '$' AS JSON
    `,

    byId() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports
        WHERE id = @id
        FOR JSON PATH;
      `;
    },

    // TODO: REFACTOR AFTER SETTING UP DB RELATIONSHIPS
    byUsername() {
      return `
        SELECT
          ${this.JSONSelect}
        FROM reports
        WHERE isDeleted = 0 AND techUsername = @username
        ORDER BY createdDateTime DESC
        FOR JSON PATH;
      `;
    },

    // TODO: REFACTOR AFTER SETTING UP DB RELATIONSHIPS
    byUsernameSoftDeleted() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports
        WHERE isDeleted = 1 AND techUsername = @username
        ORDER BY lastModifiedDateTime DESC
        FOR JSON PATH;
      `;
    },

    all() {
      return `
        SELECT
          ${this.JSONSelect}
        FROM reports
        WHERE isDeleted = 0
        ORDER BY createdDateTime DESC
        FOR JSON PATH;
      `;
    },

    allSoftDeleted() {
      return `
        SELECT 
          ${this.JSONSelect}
        FROM reports
        WHERE isDeleted = 1
        ORDER BY lastModifiedDateTime DESC
        FOR JSON PATH;
      `;
    },

    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    insert() {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        INSERT INTO
          reports
        SELECT
          *
        FROM OPENJSON(@json)
        WITH (
          ${this.withClause}
        );

        ${this.byId()}
      `;
    },

    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update() {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE reports
        SET version = json.version,
          createdDateTime = json.createdDateTime,
          lastModifiedDateTime = json.lastModifiedDateTime,
          createdBy = json.createdBy,
          updatedBy = json.updatedBy,
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
          incidentDate = json.incidentDate,
          incidentTime = json.incidentTime,
          incidentDateTime = json.incidentDateTime,
          incidentCopyTimestamp = json.incidentCopyTimestamp,
          incidentType = json.incidentType,
          incidentPos = json.incidentPos,
          incidentIsProcedural = json.incidentIsProcedural,
          incidentError = json.incidentError,
          incidentTransactionType = json.incidentTransactionType,
          incidentTransactionNumber = json.incidentTransactionNumber,
          incidentTransactionIsIRCreated = json.incidentTransactionIsIRCreated,
          incidentDetails = json.incidentDetails,
          techName = json.techName,
          techUsername = json.techUsername,
          techInitials = json.techInitials,
          techIsOnCall = json.techIsOnCall,
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
      lastModifiedDateTime = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
      WHERE id = @id;
    `,

    undoSoftDelete() {
      return `
        UPDATE reports
        SET isDeleted = 0,
        lastModifiedDateTime = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE id = @id;

        ${this.byId()}
      `;
    },

    getSuperPassword: "SELECT password FROM super;",
  },
};

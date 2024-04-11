import { mssql } from "../../../config/db.config.js";
import { checkSchema, body } from "express-validator";

// checkSchema({
//   id: {
//     isUUID: { options: { version: "4" } },
//   },
// });

export const Report = {
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

    return report;
  },

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

    // TO REFACTOR AFTER SETTING UP DB RELATIONSHIPS
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

    // TO REFACTOR AFTER SETTING UP DB RELATIONSHIPS
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
      `;
    },

    delete: "DELETE FROM reports WHERE id = @id;",

    softDelete: `
      UPDATE reports
      SET isDeleted = 1,
      lastModifiedDateTime = GETDATE()
      WHERE id = @id;
    `,

    undoSoftDelete: `
      UPDATE reports
      SET isDeleted = 0,
      lastModifiedDateTime = GETDATE()
      WHERE id = @id;
    `,
  },

  schema: {
    /**
     *
     *  VALIDATION TO CREATE A REPORT
     *
     **/
    create: {
      id: {
        exists: { errorMessage: "Id is required.", bail: true },
        isUUID: { errorMessage: "Invalid id." },
      },
      version: {
        exists: { errorMessage: "Version is required.", bail: true },
        isSemVer: { errorMessage: "Invalid version." },
      },
      createdDateTime: {
        exists: { errorMessage: "createdDateTime is required.", bail: true },
        isDate: { errorMessage: "Invalid date for createdDateTime." },
      },
      lastModifiedDateTime: {
        exists: {
          errorMessage: "lastModifiedDateTime is required.",
          bail: true,
        },
        isDate: { errorMessage: "Invalid date for lastModifiedDateTime." },
      },
      createdBy: {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "Created by is required.", bail: true },
        notEmpty: { errorMessage: "Created by can't be empty.", bail: true },
        isString: { errorMessage: "Created by should be a string" },
      },
      updatedBy: {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "Updated by is required.", bail: true },
        notEmpty: { errorMessage: "Updated by can't be empty.", bail: true },
        isString: { errorMessage: "Updated by should be a string" },
      },
      isDeleted: {
        exists: { errorMessage: "isDeleted is required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "isDeleted should be a boolean (true or false).",
        },
      },
      isWebhookSent: {
        exists: { errorMessage: "isWebhookSent is required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "isWebhookSent should be a boolean (true or false).",
        },
      },
      hasTriggeredWebhook: {
        exists: {
          errorMessage: "hasTriggeredWebhook is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "hasTriggeredWebhook should be a boolean (true or false).",
        },
      },

      /********************************************
       *  "call": {
       *    "date": "2023-11-05",
       *    "time": "00:12",
       *    "dateTime": "11/5/2023 12:12 AM",
       *    "phone": "No Caller ID",
       *    "status": "Completed"
       *  }
       ******************************************/
      "call.date": {
        exists: { errorMessage: "call.date is required.", bail: true },
        isDate: { errorMessage: "Invalid date for call.date." },
      },
      "call.time": {
        exists: { errorMessage: "call.time is required.", bail: true },
        isTime: {
          options: { hourFormat: "hour12" },
          errorMessage: "Invalid time for call.time.",
        },
      },
      "call.dateTime": {
        exists: { errorMessage: "call.dateTime is required.", bail: true },
        isDate: { errorMessage: "Invalid date for call.dateTime." },
      },
      "call.phone": {
        exists: { errorMessage: "call.phone is required.", bail: true },
        isString: { errorMessage: "call.phone should be a string" },
      },
      "call.status": {
        exists: { errorMessage: "call.status is required.", bail: true },
        notEmpty: { errorMessage: "call.status can't be empty.", bail: true },
        isIn: {
          options: [["In Progress", "Completed"]],
          errorMessage:
            "Invalid call.status. Only in progress or completed are allowed.",
        },
      },

      /********************************************
       *  "store": {
       *    "number": "2023-11-05",
       *    "employee": {
       *      "name": "John Doe",
       *      "isStoreManager": false
       *    }
       *    "districtManager":  {
       *      "name": "Carolane Brisebois",
       *      "username": "carolane.brisebois",
       *      "isContacted": false
       *    }
       *  }
       ******************************************/
      "store.number": {
        exists: { errorMessage: "store.number is required.", bail: true },
        notEmpty: { errorMessage: "store.number can't be empty.", bail: true },
        isString: { errorMessage: "store.number should be a string" },
      },
      "store.employee.name": {
        exists: {
          errorMessage: "store.employee.name is required.",
          bail: true,
        },
        isString: {
          errorMessage: "store.employee.name should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 50 },
          errorMessage:
            "Invalid store.employee.name length, max 50 characters allowed.",
        },
      },
      "store.employee.isStoreManager": {
        exists: {
          errorMessage: "store.employee.isStoreManager is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "store.employee.isStoreManager should be a boolean (true or false).",
        },
      },
      "store.districtManager.name": {
        exists: {
          errorMessage: "store.districtManager.name is required.",
          bail: true,
        },
        notEmpty: {
          errorMessage: "store.districtManager.name can't be empty.",
          bail: true,
        },
        isString: {
          errorMessage: "store.districtManager.name should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 50 },
          errorMessage:
            "Invalid store.districtManager.name length, max 50 characters allowed.",
        },
      },
      "store.districtManager.username": {
        exists: {
          errorMessage: "store.districtManager.username is required.",
          bail: true,
        },
        notEmpty: {
          errorMessage: "store.districtManager.username can't be empty.",
          bail: true,
        },
        isString: {
          errorMessage: "store.districtManager.username should be a string",
        },
      },
      "store.districtManager.isContacted": {
        exists: {
          errorMessage: "store.districtManager.isContacted is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "store.districtManager.isContacted should be a boolean (true or false).",
        },
      },

      /********************************************
       *  "incident": {
       *    "title": "102 Transaction Error",
       *    "date": "2023-11-05",
       *    "time": "00:12",
       *    "dateTime": "11/5/2023 12:12 AM",
       *    "copyTimestamp": true,
       *    "type": "Bug",
       *    "pos": "",
       *    "isProcedural": false,
       *    "error": "",
       *    "transaction": {
       *      "type": "Sale",
       *      "number": "",
       *      "isIRCreated": false
       *    },
       *    "details": ""
       *  }
       ********************************************/
      "incident.title": {
        exists: { errorMessage: "call.phone is required.", bail: true },
        notEmpty: { errorMessage: "call.phone can't be empty.", bail: true },
        isString: {
          errorMessage: "call.phone should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 100 },
          errorMessage:
            "Invalid incident.title length, max 100 characters allowed.",
        },
      },
      "incident.date": {
        exists: { errorMessage: "incident.date is required.", bail: true },
        isDate: { errorMessage: "Invalid date for incident.date." },
      },
      "incident.time": {
        exists: { errorMessage: "incident.time is required.", bail: true },
        isTime: {
          options: { hourFormat: "hour12" },
          errorMessage: "Invalid time for incident.time.",
        },
      },
      "incident.dateTime": {
        exists: {
          errorMessage: "incident.dateTime is required.",
          bail: true,
        },
        isDate: { errorMessage: "Invalid date for incident.dateTime." },
      },
      "incident.copyTimestamp": {
        exists: {
          errorMessage: "incident.copyTimestamp is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "incident.copyTimestamp should be a boolean (true or false).",
        },
      },
      "incident.type": {
        exists: { errorMessage: "incident.type is required.", bail: true },
        notEmpty: {
          errorMessage: "incident.type can't be empty.",
          bail: true,
        },
        isString: { errorMessage: "incident.type should be a string" },
      },
      "incident.pos": {
        exists: { errorMessage: "incident.pos is required.", bail: true },
        isString: {
          errorMessage: "incident.pos should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 1 },
          errorMessage: "Invalid incident.pos length, max 1 character allowed.",
        },
      },
      "incident.isProcedural": {
        exists: {
          errorMessage: "incident.isProcedural is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "incident.isProcedural should be a boolean (true or false).",
        },
      },
      "incident.error": {
        exists: { errorMessage: "incident.error is required.", bail: true },
        isString: {
          errorMessage: "incident.error should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 100 },
          errorMessage:
            "Invalid incident.error length, max 100 characters allowed.",
        },
      },
      "incident.transaction.*": {
        optional: true,
      },
      "incident.transaction.type": {
        notEmpty: {
          errorMessage: "incident.transaction.type can't be empty.",
          bail: true,
        },
        isString: {
          errorMessage: "incident.transaction.type should be a string",
        },
      },
      "incident.transaction.number": {
        isString: {
          errorMessage: "incident.transaction.number should be a string",
        },
      },
      "incident.transaction.isIRCreated": {
        isBoolean: {
          options: { strict: true },
          errorMessage:
            "incident.transaction.isIRCreated should be a boolean (true or false).",
        },
      },
      "incident.details": {
        exists: { errorMessage: "incident.details is required.", bail: true },
        notEmpty: {
          errorMessage: "incident.details can't be empty.",
          bail: true,
        },
        isString: { errorMessage: "incident.details should be a string" },
      },

      /********************************************
       *  "tech": {
       *    "name": "William Evora",
       *    "username": "william.evora",
       *    "initials": "WE",
       *    "isOnCall": true
       *  }
       ******************************************/
      "tech.name": {
        exists: { errorMessage: "tech.name is required.", bail: true },
        notEmpty: {
          errorMessage: "tech.name can't be empty.",
          bail: true,
        },
        isString: { errorMessage: "tech.name should be a string" },
      },
      "tech.username": {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "tech.username is required.", bail: true },
        notEmpty: {
          errorMessage: "tech.username can't be empty.",
          bail: true,
        },
        isString: { errorMessage: "tech.username should be a string" },
      },
      "tech.initials": {
        exists: { errorMessage: "tech.initials is required.", bail: true },
        notEmpty: {
          errorMessage: "tech.initials can't be empty.",
          bail: true,
        },
        isString: {
          errorMessage: "tech.initials should be a string",
          bail: true,
        },
        isLength: {
          options: { max: 2 },
          errorMessage: "Invalid initials length, max 2 characters allowed.",
        },
      },
      "tech.isOnCall": {
        exists: {
          errorMessage: "tech.isOnCall is required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage: "tech.isOnCall should be a boolean (true or false).",
        },
      },
    },
  },
};

import { mssql } from "../../../config/db.config.js";
import validator from "validator";

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

export const isPOSNumber = (value) => {
  if (typeof value !== "string" || value.length !== 1) throw new Error();

  const number = Number(value);
  console.log(number);
  if (number < 1 || number > 3) throw new Error();
};

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
        exists: { errorMessage: "required.", bail: true },
        isUUID: { errorMessage: "invalid UUID." },
      },
      version: {
        exists: { errorMessage: "required.", bail: true },
        isSemVer: { errorMessage: "invalid version." },
      },
      createdDateTime: {
        exists: { errorMessage: "required.", bail: true },
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: "invalid date (see ISO 8601).",
        },
      },
      lastModifiedDateTime: {
        exists: { errorMessage: "required.", bail: true },
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: "invalid date (see ISO 8601).",
        },
      },
      createdBy: {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      updatedBy: {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "required.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      isDeleted: {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      isWebhookSent: {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      hasTriggeredWebhook: {
        exists: {
          errorMessage: "required.",
          bail: true,
        },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },

      "**.dateTime": {
        trim: {},
        toUpperCase: {},
        isDateTime: {
          errorMessage:
            "invalid date & time, format is: MM/DD/YYYY HH:mm AM|PM.",
        },
      },

      "**.date": {
        trim: {},
        isDate: {
          errorMessage: "invalid date, format is: YYYY/MM/DD or YYYY-MM-DD.",
        },
      },

      "**.time": {
        trim: {},
        isTime: { errorMessage: "invalid time, format is: HH:mm." },
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
        exists: { errorMessage: "required.", bail: true },
      },
      "call.time": {
        exists: { errorMessage: "required.", bail: true },
      },
      "call.dateTime": {
        exists: { errorMessage: "required.", bail: true },
      },
      "call.phone": {
        exists: { errorMessage: "required.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      "call.status": {
        exists: { errorMessage: "required.", bail: true },
        isIn: {
          options: [["In Progress", "Completed"]],
          errorMessage: "only 'In Progress' or 'Completed' are allowed.",
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
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      "store.employee.name": {
        exists: { errorMessage: "required.", bail: true },
        isString: { errorMessage: "should be a string.", bail: true },
        isLength: {
          options: { max: 50 },
          errorMessage: "invalid length, max of 50 characters allowed.",
        },
      },
      "store.employee.isStoreManager": {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      "store.districtManager.name": {
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string.", bail: true },
        isLength: {
          options: { max: 50 },
          errorMessage: "invalid length, max of 50 characters allowed.",
        },
      },
      "store.districtManager.username": {
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      "store.districtManager.isContacted": {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
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
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string.", bail: true },
        isLength: {
          options: { max: 100 },
          errorMessage: "invalid length, max of 100 characters allowed.",
        },
      },
      "incident.date": {
        exists: { errorMessage: "required.", bail: true },
      },
      "incident.time": {
        exists: { errorMessage: "required.", bail: true },
      },
      "incident.dateTime": {
        exists: { errorMessage: "required.", bail: true },
      },
      "incident.copyTimestamp": {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      "incident.type": {
        exists: { errorMessage: "required.", bail: true },
        isIn: {
          options: [
            [
              "Bug",
              "Update",
              "Outage",
              "Software",
              "Hardware",
              "Networking",
              "Authentication",
              "Employee Mistake",
              "Other",
            ],
          ],
          errorMessage: `only 'Bug', 'Update', 'Outage', 'Software', 'Hardware', 'Networking', 'Authentication', 'Employee Mistake', 'Other' are allowed.`,
        },
      },
      "incident.pos": {
        exists: { errorMessage: "required.", bail: true },
        isIn: {
          options: [["", "1", "2", "3"]],
          errorMessage: `only '1', '2', '3' are allowed.`,
        },
      },
      "incident.isProcedural": {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      "incident.error": {
        exists: { errorMessage: "required.", bail: true },
        isString: { errorMessage: "should be a string.", bail: true },
        isLength: {
          options: { max: 100 },
          errorMessage: "invalid length, max of 100 characters allowed.",
        },
      },
      "incident.transaction.*": {
        optional: true,
      },
      "incident.transaction.type": {
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      "incident.transaction.number": {
        isString: {
          errorMessage: "should be a string.",
        },
      },
      "incident.transaction.isIRCreated": {
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
      "incident.details": {
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
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
        isString: { errorMessage: "tech.name should be a string." },
      },
      "tech.username": {
        // TODO: CHECK IF VALID USERNAME
        exists: { errorMessage: "required.", bail: true },
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string." },
      },
      "tech.initials": {
        exists: { errorMessage: "required.", bail: true },
        isString: { errorMessage: "should be a string.", bail: true },
        isLength: {
          options: { max: 2 },
          errorMessage: "invalid length, max 2 characters allowed.",
        },
      },
      "tech.isOnCall": {
        exists: { errorMessage: "required.", bail: true },
        isBoolean: {
          options: { strict: true },
          errorMessage: "should be a boolean (true or false).",
        },
      },
    },
  },
};

export default {
  create: {
    "**.date": {
      trim: {},
      isDate: {
        errorMessage: "invalid date, format is: YYYY/MM/DD or YYYY-MM-DD.",
      },
    },

    "**.time": {
      trim: {},
      toUpperCase: {},
      isTimeCustom: {
        errorMessage:
          "invalid time, format is: HH:mm[:ss] or HH:mm[:ss] AM|PM.",
      },
    },

    "**.dateTime": {
      trim: {},
      toUpperCase: {},
      isDateTime: {
        errorMessage: "invalid date & time, format is: MM/DD/YYYY HH:mm AM|PM.",
      },
    },

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
      exists: {
        bail: true,
        errorMessage: "required.",
        // if lastModifiedDateTime is NOT null, check if: is ISO 8601
        if: (lastModifiedDateTime) => lastModifiedDateTime !== null,
      },
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
      exists: {
        errorMessage: "required.",
        bail: true,
        // if updatedBy is NOT null, check if is: not empty & is string
        if: (updatedBy) => updatedBy !== null,
      },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
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

    /********************************************
     *  "call": {
     *    "date": "2023-11-05",
     *    "time": "00:12",
     *    "dateTime": "11/5/2023 12:12 AM",
     *    "phone": "No Caller ID",
     *    "status": "Completed"
     *  }
     ******************************************/
    call: {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
    "call.date": {
      exists: { errorMessage: "required.", bail: true },
    },
    "call.time": {
      exists: { errorMessage: "required.", bail: true },
    },
    "call.dateTime": {
      exists: { errorMessage: "required.", bail: true },
    },
    // TODO: CHECK IF IS VALID PHONE NUMBER
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
    store: {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
    "store.number": {
      // TODO: CHECK IF VALID STORE NUMBER, MIGHT NEED TO CHANGE TO ARRAY DATA TYPE
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
    },
    "store.employee": {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
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
    "store.districtManager": {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
    // TODO: CHECK IF VALID DISTRICT MANAGER (BY USERNAME)
    "store.districtManager.name": {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string.", bail: true },
      isLength: {
        options: { max: 50 },
        errorMessage: "invalid length, max of 50 characters allowed.",
      },
    },
    // TODO: CHECK IF VALID DISTRICT MANAGER (BY USERNAME)
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
    incident: {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
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
        errorMessage: `only 'Bug', 'Update', 'Outage', 'Software', 'Hardware', 'Networking', 'Authentication', 'Employee Mistake', and 'Other' are allowed.`,
      },
    },
    "incident.pos": {
      exists: { errorMessage: "required.", bail: true },
      isIn: {
        options: [["", "1", "2", "3"]],
        errorMessage: "only '1', '2', and '3' are allowed.",
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
    "incident.transaction": {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
    "incident.transaction.type": {
      optional: true,
      isIn: {
        options: [
          [
            "",
            "Sale",
            "Refund",
            "Variance",
            "Exchange",
            "Correction",
            "Promotion",
            "Employee Sale",
            "Other",
          ],
        ],
        errorMessage: `only 'Sale', 'Refund', 'Variance', 'Exchange', 'Correction', 'Promotion', 'Employee Sale', and 'Other' are allowed.`,
      },
    },
    "incident.transaction.number": {
      optional: true,
      isString: {
        errorMessage: "should be a string.",
      },
      isLength: {
        options: { max: 50 },
        errorMessage: "invalid length, max of 50 characters allowed.",
      },
    },
    "incident.transaction.isIRCreated": {
      optional: true,
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
    tech: {
      exists: { errorMessage: "required.", bail: true },
      isObject: { errorMessage: "has to be an object enclosed by {}." },
    },
    "tech.name": {
      // TODO: CHECK IF VALID USERNAME
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
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

  update() {
    return this.create;
  },

  hardDelete: {
    isHardDelete: {
      optional: true,
      isBoolean: {
        options: { strict: true },
        errorMessage: "should be a boolean (true or false).",
      },
    },
    password: {},
  },
};

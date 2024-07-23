import config from "../../../config/app.config.js";

// VALIDATION TO CREATE A REPORT
const CREATE = {
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
      errorMessage: "invalid time, format is: HH:mm[:ss] or HH:mm[:ss] AM|PM.",
    },
  },

  tableRowEl: { optional: true },

  assignedTo: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
    isValidUsername: {},
  },
  isOnCall: {
    exists: { errorMessage: "required.", bail: true },
    isBoolean: {
      options: { strict: true },
      errorMessage: "should be a boolean (true or false).",
    },
  },

  /********************************************
   *  "call": {
   *    "date": "2023-11-05",
   *    "time": "00:12",
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
  // TODO: CHECK IF IS VALID PHONE NUMBER
  "call.phone": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  "call.status": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string." },
    isIn: {
      options: [config.validation.selects.statuses],
      errorMessage: `only '${config.validation.selects.statuses.join(
        "', '"
      )}' are allowed.`,
    },
  },

  /********************************************
   *  "store": {
   *    "number": ["102", "401", "201"],
   *    "employee": {
   *      "name": "John Doe",
   *      "isStoreManager": false
   *    }
   *  }
   ******************************************/
  store: {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
  },
  "store.numbers": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },

    customSanitizer: {
      options: (_, { req }) => {
        // Keep unique values only
        req.body.store.numbers = [...new Set(req.body.store.numbers)];

        // If includes: "*" (all), add all the elements from the validation. Filter out: "*"
        if (req.body.store.numbers.includes("*"))
          req.body.store.numbers =
            config.validation.selects.storeNumbers.filter((sN) => sN !== "*");

        return req.body.store.numbers;
      },
    },
  },
  "store.employee": {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
  },
  "store.employee.name": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  "store.employee.isStoreManager": {
    exists: { errorMessage: "required.", bail: true },
    isBoolean: {
      options: { strict: true },
      errorMessage: "should be a boolean (true or false).",
    },
  },

  /********************************************
   *  "incident": {
   *    "title": "102 Transaction Error",
   *    "type": ["Bug"],
   *    "pos": "",
   *    "isProcedural": false,
   *    "error": "",
   *    "hasVarianceReport": false
   *    "transaction": {
   *      "type": ["Sale"],
   *      "number": "",
   *    },
   *    "details": "Hello World!"
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
  "incident.types": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },

    customSanitizer: {
      options: (_, { req }) => {
        // Keep unique values only
        req.body.incident.types = [...new Set(req.body.incident.types)];

        // If includes: "*" (all), add all the elements from the validation. Filter out: "*"
        if (req.body.incident.types.includes("*"))
          req.body.incident.types =
            config.validation.selects.incidentTypes.filter((iT) => iT !== "*");

        return req.body.incident.types;
      },
    },
  },
  "incident.pos": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string." },
    isIn: {
      options: [config.validation.selects.pos],
      errorMessage: `only '${config.validation.selects.pos.join(
        "', '"
      )}' are allowed.`,
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
  "incident.hasVarianceReport": {
    exists: { errorMessage: "required.", bail: true },
    isBoolean: {
      options: { strict: true },
      errorMessage: "should be a boolean (true or false).",
    },
  },
  "incident.transaction": {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
  },
  "incident.transaction.types": {
    optional: true,
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },

    customSanitizer: {
      options: (_, { req }) => {
        // Keep unique values only
        req.body.incident.transaction.types = [
          ...new Set(req.body.incident.transaction.types),
        ];

        // If includes: "*" (all), add all the elements from the validation. Filter out: "*"
        if (req.body.incident.transaction.types.includes("*"))
          req.body.incident.transaction.types =
            config.validation.selects.incidentTransactionTypes.filter(
              (iTT) => iTT !== "*"
            );

        return req.body.incident.transaction.types;
      },
    },
  },
  "incident.transaction.number": {
    exists: {
      errorMessage: "required.",
      bail: true,
      if: (_, { req }) => req.body.incident.transaction.types,
    },
    isString: {
      errorMessage: "should be a string.",
    },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  "incident.details": {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 2000 },
      errorMessage: "invalid length, max of 2,000 characters allowed.",
    },
  },
};

// VALIDATION TO UPDATE A REPORT
const UPDATE = {
  ...CREATE,
  id: {
    exists: { errorMessage: "required.", bail: true },
    isString: {
      errorMessage: "should not be a string but an integer.",
      bail: true,
      negated: true,
    },
    isBoolean: {
      options: { strict: true },
      errorMessage: "should not be a boolean but an integer.",
      negated: true,
    },
    isArray: {
      errorMessage: "should not be an array but an integer.",
      bail: true,
      negated: true,
    },
    isObject: {
      errorMessage: "should not be an object but an integer.",
      bail: true,
      negated: true,
    },
    isInt: { errorMessage: "should be an integer.", bail: true },
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
};

// VALIDATION TO IMPORT A REPORT
const IMPORT = {
  "**.date": UPDATE["**.date"],
  "**.time": UPDATE["**.time"],
  "*": {
    isObject: {
      errorMessage:
        "invalid report object, has to be enclosed by brackets {} (see documentation).",
    },
  },

  "*.createdAt": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string." },
    isISO8601: {
      options: { strict: true, strictSeparator: true },
      errorMessage: "invalid date (see ISO 8601).",
    },
  },
  "*.updatedAt": {
    exists: { errorMessage: "required.", bail: true },
    isString: { errorMessage: "should be a string." },
    isISO8601: {
      options: { strict: true, strictSeparator: true },
      errorMessage: "invalid date (see ISO 8601).",
    },
  },
  "*.createdBy": {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
  },
  "*.updatedBy": {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
  },
  "*.assignedTo": {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
  },

  "*.isOnCall": UPDATE.isOnCall,
  "*.isDeleted": UPDATE.isDeleted,
  "*.isWebhookSent": UPDATE.isWebhookSent,
  "*.hasTriggeredWebhook": UPDATE.hasTriggeredWebhook,

  "*.call": UPDATE.call,
  "*.call.date": UPDATE["call.date"],
  "*.call.time": UPDATE["call.time"],
  "*.call.phone": UPDATE["call.phone"],
  "*.call.status": UPDATE["call.status"],

  "*.store": UPDATE.store,
  "*.store.numbers": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },
  },
  "*.store.employee": UPDATE["store.employee"],
  "*.store.employee.name": UPDATE["store.employee.name"],
  "*.store.employee.isStoreManager": UPDATE["store.employee.isStoreManager"],

  "*.incident": UPDATE.incident,
  "*.incident.title": UPDATE["incident.title"],
  "*.incident.types": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },
  },
  "*.incident.pos": UPDATE["incident.pos"],
  "*.incident.isProcedural": UPDATE["incident.isProcedural"],
  "*.incident.error": UPDATE["incident.error"],
  "*.incident.hasVarianceReport": UPDATE["incident.hasVarianceReport"],
  "*.incident.transaction": UPDATE["incident.transaction"],
  "*.incident.transaction.types": {
    optional: true,
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },
  },
  "*.incident.transaction.number": {
    optional: true,
    isString: {
      errorMessage: "should be a string.",
    },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  "*.incident.details": UPDATE["incident.details"],
};

// VALIDATION TO HARD DELETE A REPORT
const HARD_DELETE = {
  password: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string" },
  },
};

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
  import: { ...IMPORT },
  hardDelete: { ...HARD_DELETE },
};

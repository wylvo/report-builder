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

  assignedTo: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
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
   *    "number": ["101", "401", "201"],
   *    "employee": {
   *      "name": "John Doe",
   *      "isStoreManager": false
   *    }
   *    "districtManager":  {
   *      "isContacted": false
   *    }
   *  }
   ******************************************/
  store: {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
  },
  "store.number": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },
    // Keep unique values only
    customSanitizer: {
      options: (_, { req }) => {
        return (req.body.store.number = [...new Set(req.body.store.number)]);
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
  "store.districtManager": {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
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
   *    "type": ["Bug"],
   *    "pos": "",
   *    "isProcedural": false,
   *    "error": "",
   *    "transaction": {
   *      "type": ["Sale"],
   *      "number": "",
   *      "isIRCreated": false
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
  "incident.type": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: `${config.validation.selects.incidentTypes.join(", ")}`,
    },
    // Keep unique values only
    customSanitizer: {
      options: (_, { req }) => {
        return (req.body.incident.type = [...new Set(req.body.incident.type)]);
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
  "incident.transaction": {
    exists: { errorMessage: "required.", bail: true },
    isObject: { errorMessage: "has to be an object enclosed by {}." },
  },
  "incident.transaction.type": {
    optional: true,
    isArray: { errorMessage: "should be an array enclosed by [].", bail: true },
    isNotEmptyArray: { errorMessage: "array can't be empty.", bail: true },
    isIn: {
      options: [],
      errorMessage: "",
    },
    // Keep unique values only
    customSanitizer: {
      options: (_, { req }) => {
        return (req.body.incident.transaction.type = [
          ...new Set(req.body.incident.transaction.type),
        ]);
      },
    },
  },
  "incident.transaction.number": {
    exists: {
      errorMessage: "required.",
      bail: true,
      if: (_, { req }) => req.body.incident.transaction.type,
    },
    isString: {
      errorMessage: "should be a string.",
    },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  "incident.transaction.isIRCreated": {
    exists: {
      errorMessage: "required.",
      bail: true,
      if: (_, { req }) => req.body.incident.transaction.type,
    },
    isBoolean: {
      options: { strict: true },
      errorMessage: "should be a boolean (true or false).",
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

// VALIDATION TO MIGRATE A REPORT
const MIGRATE = {
  ...UPDATE,
  createdAt: {
    exists: { errorMessage: "required.", bail: true },
    isISO8601: {
      options: { strict: true, strictSeparator: true },
      errorMessage: "invalid date (see ISO 8601).",
    },
  },
  updatedAt: {
    exists: { errorMessage: "required.", bail: true },
    isISO8601: {
      options: { strict: true, strictSeparator: true },
      errorMessage: "invalid date (see ISO 8601).",
    },
  },
  createdBy: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isValidUsername: {},
  },
  updatedBy: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isValidUsername: {},
  },
};

// VALIDATION TO IMPORT A REPORT
const IMPORT = {
  areValidUsernames: {},
};

// VALIDATION TO HARD DELETE A REPORT
const HARD_DELETE = {
  password: {
    exists: {
      errorMessage: "required.",
      bail: true,
    },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string" },
  },
};

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
  migrate: { ...MIGRATE },
  import: { ...IMPORT },
  hardDelete: { ...HARD_DELETE },
};

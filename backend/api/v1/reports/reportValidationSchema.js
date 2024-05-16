import config from "../../../config/app.config.js";

const DEFAULT_CREATE = {
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

  "**.dateTime": {
    trim: {},
    toUpperCase: {},
    isDateTime: {
      errorMessage: "invalid date & time, format is: MM/DD/YYYY HH:mm AM|PM.",
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
    isArray: { errorMessage: "should be an array." },
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
  "incident.type": {
    exists: { errorMessage: "required.", bail: true },
    isArray: { errorMessage: "should be an array." },
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
    isArray: { errorMessage: "should be an array." },
    isIn: {
      options: [],
      errorMessage: "",
    },
    // Keep unique values only
    customSanitizer: {
      options: (_, { req }) => {
        return (req.body.store.number = [
          ...new Set(req.body.incident.transaction.type),
        ]);
      },
    },
  },
  "incident.transaction.number": {
    optional: true,
    isString: {
      errorMessage: "should be a string.",
    },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
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
    isLength: {
      options: { max: 2000 },
      errorMessage: "invalid length, max of 2,000 characters allowed.",
    },
  },
};

export default {
  /**
   *  VALIDATION TO CREATE A REPORT
   **/
  create: {
    // uuid: {
    //   exists: { errorMessage: "required.", bail: true },
    //   isUUID: { errorMessage: "invalid UUID." },
    //   isNewReport: { errorMessage: "a report already exists with this id." },
    // },
    ...DEFAULT_CREATE,
  },

  /**
   *  VALIDATION TO UPDATE A REPORT (SAME AS CREATE, EXCEPT UUID)
   **/
  update: {
    ...DEFAULT_CREATE,
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
  },

  /**
   *  VALIDATION TO HARD DELETE A REPORT
   **/
  hardDelete: {
    isHardDelete: {
      optional: true,
      isBoolean: {
        options: { strict: true },
        errorMessage: "should be a boolean (true or false).",
      },
    },
    password: {
      exists: {
        errorMessage: "required.",
        bail: true,
        if: (_, { req }) => req.body.isHardDelete === true,
      },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string" },
    },
  },
};

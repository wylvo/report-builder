import { DistrictManagers } from "./districtManager.model.js";

// VALIDATION TO CREATE A DISTRICT MANAGER
const CREATE = {
  fullName: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  username: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
    matches: {
      options: /^[a-zA-Z0-9._-]+$/,
      errorMessage:
        "Only letters, numbers, periods, dashes, and underscores are allowed.",
    },
    toLowerCase: {},

    custom: {
      options: async (username, { req }) => {
        const districtManager = await DistrictManagers.findByUsername(username);
        if (districtManager && String(districtManager.id) !== req.params.id)
          throw new Error();
        return districtManager;
      },
      errorMessage: "already in use.",
    },
  },
  profilePictureURI: {
    optional: true,
    isDataURI: { errorMessage: "invalid data URI." },
  },
};

// VALIDATION TO CREATE A DISTRICT MANAGER
const UPDATE = {
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
  fullName: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 100 },
      errorMessage: "invalid length, max of 100 characters allowed.",
    },
  },
  username: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 19 },
      errorMessage: "invalid length, max of 19 characters allowed.",
    },
    matches: {
      options: /^[a-zA-Z0-9._-]+$/,
      errorMessage:
        "Only letters, numbers, periods, dashes, and underscores are allowed.",
    },
    toLowerCase: {},

    custom: {
      options: async (username, { req }) => {
        const districtManager = await DistrictManagers.findByUsername(username);
        if (districtManager && String(districtManager.id) !== req.params.id)
          throw new Error();
        return districtManager;
      },
      errorMessage: "already in use.",
    },
  },
  profilePictureURI: {
    optional: true,
    isDataURI: { errorMessage: "invalid data URI." },
  },
};

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
};

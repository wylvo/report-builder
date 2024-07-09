import { Stores } from "./store.model.js";

const CREATE = {
  name: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  active: {
    optional: true,
    isBoolean: {
      options: { strict: true },
      errorMessage: "should be a boolean (true or false).",
    },
  },
  number: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  numberDK: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  address1: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  address2: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  city: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  state: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  zipcode: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 6 },
      errorMessage: "invalid length, max of 6 characters allowed.",
    },
  },
  country: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
    },
  },
  phoneNumber: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  email: {
    optional: true,
    isEmail: { errorMessage: "invalid email address.", bail: true },
    isLength: {
      options: { max: 254 },
      errorMessage: "invalid length, max of 254 characters allowed.",
    },
    custom: {
      options: async (email) => {
        const store = await Stores.findByEmail(email);
        if (store) throw new Error();
      },
      errorMessage: "already in use.",
    },
  },
  districtManager: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
    isValidDistrictManagerUsername: {},
  },
};

const UPDATE = {
  ...CREATE,
  number: {
    optional: true,
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  email: {
    optional: true,
    isEmail: { errorMessage: "invalid email address.", bail: true },
    isLength: {
      options: { max: 254 },
      errorMessage: "invalid length, max of 254 characters allowed.",
    },
    custom: {
      options: async (email, { req }) => {
        const store = await Stores.findByEmail(email);
        if (store && String(store.number) !== req.params.number)
          throw new Error();
      },
      errorMessage: "already in use.",
    },
  },
};

// VALIDATION TO HARD DELETE A DISTRICT MANAGER
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
  hardDelete: { ...HARD_DELETE },
};

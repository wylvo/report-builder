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
  districtManager: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string." },
    isLength: {
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
    isDistrictManager: {},
  },
};

const UPDATE = { ...CREATE };

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
};

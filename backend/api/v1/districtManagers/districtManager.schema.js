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
      options: { max: 20 },
      errorMessage: "invalid length, max of 20 characters allowed.",
    },
  },
  profilePictureURI: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string.", bail: true },
  },
};
const UPDATE = { ...CREATE };
const DELETE = {};

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
  delete: { ...DELETE },
};

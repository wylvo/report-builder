export default {
  resetSuperPassword: {
    currentPassword: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
      isLength: {
        options: { min: 32, max: 128 },
        errorMessage:
          "invalid length, min of 32 and max of 128 characters allowed.",
      },
    },

    newPassword: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
      isLength: {
        options: { min: 32, max: 128 },
        errorMessage:
          "invalid length, min of 32 and max of 128 characters allowed.",
      },
    },

    newPasswordConfirmation: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      custom: {
        options: (value, { req }) => {
          return value === req.body.newPassword;
        },
        errorMessage: "passwords do not match.",
      },
    },
  },
};

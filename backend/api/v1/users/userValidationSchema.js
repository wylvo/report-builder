import { User } from "./userModel.js";
import config from "../../../config/app.config.js";

export default {
  /**
   *  VALIDATION TO CREATE A USER
   **/
  create: {
    role: {
      exists: { errorMessage: "required.", bail: true },
      isString: { errorMessage: "should be a string." },
      isIn: {
        options: [config.validation.selects.roles],
        errorMessage: `only '${config.validation.selects.roles.join(
          "', '"
        )}' are allowed.`,
      },
    },
    active: {
      optional: true,
      isBoolean: {
        options: { strict: true },
        errorMessage: "should be a boolean (true or false).",
      },
    },
    email: {
      exists: { errorMessage: "required.", bail: true },
      isEmail: { errorMessage: "invalid email address.", bail: true },
      custom: {
        options: async (email) => {
          const user = await User.findByEmail(email);
          if (user) throw new Error();
        },
        errorMessage: "already in use.",
      },
    },
    password: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
    },
    passwordConfirmation: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      custom: {
        options: (value, { req }) => {
          return value === req.body.password;
        },
        errorMessage: "passwords do not match.",
      },
    },
    profilePictureURI: {
      optional: true,
      isDataURI: { errorMessage: "invalid data URI." },
    },
    fullName: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
    },
    username: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string.", bail: true },
      custom: {
        options: async (username, { req }) => {
          const user = await User.findByUsername(username);
          if (user && String(user.id) !== req.params.id) throw new Error();
          return user;
        },
        errorMessage: "already in use.",
      },
    },
    initials: {
      optional: true,
      isString: { errorMessage: "should be a string.", bail: true },
      isLength: {
        options: { max: 2 },
        errorMessage: "invalid length, max of 2 characters allowed.",
      },
    },
  },

  /**
   *  VALIDATION TO UPDATE A USER
   **/
  update: {
    role: {
      optional: true,
      isString: { errorMessage: "should be a string." },
      isIn: {
        options: [config.validation.selects.roles],
        errorMessage: `only '${config.validation.selects.roles.join(
          "', '"
        )}' are allowed.`,
      },
    },
    active: {
      optional: true,
      isBoolean: {
        options: { strict: true },
        errorMessage: "should be a boolean (true or false).",
      },
    },
    email: {
      optional: true,
      isEmail: { errorMessage: "invalid email address.", bail: true },
      custom: {
        options: async (email, { req }) => {
          const user = await User.findByEmail(email);
          if (user && String(user.id) !== req.params.id) throw new Error();
        },
        errorMessage: "already in use.",
      },
    },
    profilePictureURI: {
      optional: true,
      isDataURI: { errorMessage: "invalid data URI" },
    },
    fullName: {
      optional: true,
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string" },
    },
    username: {
      optional: true,
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string", bail: true },
      custom: {
        options: async (username, { req }) => {
          const user = await User.findByUsername(username);
          if (user && String(user.id) !== req.params.id) throw new Error();
          return user;
        },
        errorMessage: "already in use.",
      },
    },
    initials: {
      optional: true,
      isString: { errorMessage: "should be a string.", bail: true },
      isLength: {
        options: { max: 2 },
        errorMessage: "invalid length, max 2 characters allowed.",
      },
    },
  },

  /**
   *  VALIDATION TO RESET A USER PASSWORD
   **/
  resetPassword() {
    return {
      password: this.create.password,
      passwordConfirmation: this.create.passwordConfirmation,
    };
  },

  /**
   *  VALIDATION TO SIGN IN WITH A USER
   **/
  signIn: {
    email: {
      exists: { errorMessage: "required.", bail: true },
      isEmail: { errorMessage: "invalid email address." },
    },
    password: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string" },
    },
  },
};

import { Users } from "./user.model.js";
import config from "../../../config/server.config.js";

export default {
  // VALIDATION TO CREATE A USER
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
      isLength: {
        options: { max: 254 },
        errorMessage: "invalid length, max of 254 characters allowed.",
      },
      toLowerCase: {},

      custom: {
        options: async (email) => {
          const user = await Users.findByEmail(email);
          if (user) throw new Error();
        },
        errorMessage: "already in use.",
      },
    },
    password: {
      exists: { errorMessage: "required.", bail: true },
      notEmpty: { errorMessage: "can't be empty.", bail: true },
      isString: { errorMessage: "should be a string." },
      isLength: {
        options: { max: 128 },
        errorMessage: "invalid length, max of 128 characters allowed.",
      },
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
          const user = await Users.findByUsername(username);
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
    tableRowEl: { optional: true },
  },

  // VALIDATION TO UPDATE A USER
  update() {
    return {
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
      role: {
        ...this.create.role,
        optional: true,
      },
      active: {
        ...this.create.active,
        optional: true,
      },
      email: {
        optional: true,
        isEmail: { errorMessage: "invalid email address.", bail: true },
        isLength: {
          options: { max: 254 },
          errorMessage: "invalid length, max of 254 characters allowed.",
        },
        toLowerCase: {},

        custom: {
          options: async (email, { req }) => {
            const user = await Users.findByEmail(email);
            if (user && String(user.id) !== req.params.id) throw new Error();
          },
          errorMessage: "already in use.",
        },
      },
      profilePictureURI: {
        ...this.create.profilePictureURI,
        optional: true,
      },
      username: {
        optional: true,
        notEmpty: { errorMessage: "can't be empty.", bail: true },
        isString: { errorMessage: "should be a string", bail: true },
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
            const user = await Users.findByUsername(username);
            if (user && String(user.id) !== req.params.id) throw new Error();
            return user;
          },
          errorMessage: "already in use.",
        },
      },
      fullName: {
        ...this.create.fullName,
        optional: true,
      },
      initials: {
        ...this.create.initials,
        optional: true,
      },
    };
  },

  // VALIDATION TO RESET A USER PASSWORD
  resetPassword() {
    return {
      password: this.create.password,
      passwordConfirmation: this.create.passwordConfirmation,
    };
  },

  // VALIDATION TO SIGN IN WITH A USER
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

import { Users } from "./user.model.js";
import config from "../../../config/server.config.js";

// VALIDATION TO CREATE A USER
const CREATE = {
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
      options: { max: 255 },
      errorMessage: "invalid length, max of 255 characters allowed.",
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
      options: async (username) => {
        const user = await Users.findByUsername(username);
        if (user) throw new Error();
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
};

// VALIDATION TO UPDATE A USER
const UPDATE = {
  role: {
    ...CREATE.role,
    optional: true,
  },
  active: {
    ...CREATE.active,
    optional: true,
  },
  email: {
    ...CREATE.email,
    optional: true,

    custom: {
      options: async (email, { req }) => {
        const user = await Users.findByEmail(email);
        if (user && user.id !== req.userFetched.id) throw new Error();
      },
      errorMessage: "already in use.",
    },
  },
  profilePictureURI: {
    ...CREATE.profilePictureURI,
    optional: true,
  },
  username: {
    ...CREATE.username,
    optional: true,

    custom: {
      options: async (username, { req }) => {
        const user = await Users.findByUsername(username);
        if (user && user.id !== req.userFetched.id) throw new Error();
        return user;
      },
      errorMessage: "already in use.",
    },
  },
  fullName: {
    ...CREATE.fullName,
    optional: true,
  },
  initials: {
    ...CREATE.initials,
    optional: true,
  },
};

// VALIDATION TO RESET A USER PASSWORD
const RESET_PASSWORD = {
  password: CREATE.password,
  passwordConfirmation: CREATE.passwordConfirmation,
};

// VALIDATION TO TRANSFER ALL REPORT RELATIONSHIPS FROM A USER TO ANOTHER USER
const TRANSFER_ALL_REPORT_RELATIONSHIPS = {
  fromUsername: {
    ...CREATE.username,
    custom: {
      options: async (username, { req }) => {
        const user = await Users.findByUsername(username);
        if (!user) throw new Error(`user '${username}' not found.`);
        return (req.fromUser = user);
      },
    },
  },
  toUsername: {
    ...CREATE.username,
    custom: {
      options: async (username, { req }) => {
        const user = await Users.findByUsername(username);
        if (!user) throw new Error(`user '${username}' not found.`);
        return (req.toUser = user);
      },
    },
  },
};

// VALIDATION TO SIGN IN WITH A USER
const SIGN_IN = {
  email: {
    exists: { errorMessage: "required.", bail: true },
    isEmail: { errorMessage: "invalid email address." },
  },
  password: {
    exists: { errorMessage: "required.", bail: true },
    notEmpty: { errorMessage: "can't be empty.", bail: true },
    isString: { errorMessage: "should be a string" },
  },
};

export default {
  create: { ...CREATE },
  update: { ...UPDATE },
  resetPassword: { ...RESET_PASSWORD },
  signIn: { ...SIGN_IN },
  transferAllReportRelationships: { ...TRANSFER_ALL_REPORT_RELATIONSHIPS },
};

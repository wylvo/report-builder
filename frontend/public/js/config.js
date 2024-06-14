export const DEFAULT_PROFILE_PICTURE = "/img/default_profile_picture.jpg";

export const DEFAULT_USER_CREATE = Object.freeze({
  role: "string",
  active: false,
  email: "string",
  password: "string",
  passwordConfirmation: "string",
  fullName: "string",
  username: "string",
  initials: "string", // Can be "null"
  profilePictureURI: "string", // Can be "null"
  tableRowEl: {},
});

export const DEFAULT_USER_UPDATE = Object.freeze({
  id: 0,
  role: "string",
  active: false,
  email: "string",
  fullName: "string",
  username: "string",
  initials: "string", // Can be "null"
  profilePictureURI: "string", // Can be "null"
  tableRowEl: {},
});

export const DEFAULT_REPORT_CREATE = Object.freeze({
  assignedTo: "string",
  isOnCall: false,
  tableRowEl: {},
  call: {
    date: "string",
    time: "string",
    phone: "string",
    status: "string",
  },
  store: {
    numbers: [],
    employee: {
      name: "string",
      isStoreManager: false,
    },
  },
  incident: {
    title: "string",
    types: [],
    pos: "string",
    isProcedural: false,
    error: "string",

    // Can be empty object
    transaction: {
      types: [],
      number: "string",
      hasVarianceReport: false,
    },
    details: "string",
  },
});

export const DEFAULT_REPORT_UPDATE = Object.freeze({
  isDeleted: false,
  isWebhookSent: false,
  hasTriggeredWebhook: false,
  ...DEFAULT_REPORT_CREATE,
});

export const DEFAULT_REPORT_IMPORT = Object.freeze({
  createdBy: "string",
  updatedBy: "string",
  createdAt: "string",
  updatedAt: "string",
  ...DEFAULT_REPORT_UPDATE,
});

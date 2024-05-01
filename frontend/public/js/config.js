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
  id: "string",
  role: "string",
  active: false,
  email: "string",
  fullName: "string",
  username: "string",
  initials: "string", // Can be "null"
  profilePictureURI: "string", // Can be "null"
  tableRowEl: {},
});

export const DEFAULT_REPORT = Object.freeze({
  id: "string",
  version: "string",
  createdAt: "string (Date)",
  updatedAt: "string (Date)",
  createdBy: "string",
  updatedBy: "string",
  assignedTo: "string",
  isOnCall: false,
  isDeleted: false,
  isWebhookSent: false,
  hasTriggeredWebhook: false,
  tableRowEl: {},
  call: {
    date: "string",
    time: "string",
    dateTime: "string (Date)",
    phone: "string",
    status: "string",
  },
  store: {
    number: "string",
    employee: {
      name: "string",
      isStoreManager: false,
    },
    districtManager: {
      name: "string",
      username: "string",
      isContacted: false,
    },
  },
  incident: {
    title: "string",
    date: "string",
    time: "string",
    dateTime: "string (Date)",
    copyTimestamp: false,
    type: "string",
    pos: "string",
    isProcedural: false,
    error: "string",

    // Can be empty object
    transaction: {
      type: "string",
      number: "string",
      isIRCreated: false,
    },
    details: "string",
  },
});

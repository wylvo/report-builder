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

export const DEFAULT_REPORT = Object.freeze({
  assignedTo: "string",
  isOnCall: false,
  isDeleted: false,
  isWebhookSent: false,
  hasTriggeredWebhook: false,
  tableRowEl: {},
  call: {
    date: "string",
    time: "string",
    phone: "string",
    status: "string",
  },
  store: {
    number: ["string"],
    employee: {
      name: "string",
      isStoreManager: false,
    },
    districtManager: {
      isContacted: false,
    },
  },
  incident: {
    title: "string",
    type: ["string"],
    pos: "string",
    isProcedural: false,
    error: "string",

    // Can be empty object
    transaction: {
      number: "string",
      isIRCreated: false,
    },
    details: "string",
  },
});

export const DEFAULT_REPORT = Object.freeze({
  id: "string",
  version: "string",
  createdDateTime: "string (Date)",
  lastModifiedDateTime: "string (Date)", // Can be "null"
  createdBy: "string",
  updatedBy: "string", // Can be "null"
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
  tech: {
    name: "string",
    username: "string",
    initials: "string",
    isOnCall: false,
  },
});

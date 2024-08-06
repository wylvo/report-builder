// Instanciating Express' Server & Server Port
let port = process.env.SERVER_PORT;

if (process.env.NODE_ENV === "development") port = 5049;

const config = {
  rateLimter: {
    maxNumberOfRequests: 75, // Max number of requests before a client is restricted to make another request
    windowMilliseconds: 30000, // How long before a client is eligible to make another request in milliseconds
    message: "Too many request from this IP, please try again later!",
  },
  request: {
    byteLimit: "2mb",
    type: "*/*",
    import: {
      reportCountLimit: 500, // 1 report is around 3 800 bytes. 3 800 bytes * 500 reports = 1,900,000 bytes or 1.9 MB
    },
    sensitiveKeys: {
      passwordConfirmation: "passwordConfirmation",
      password: "password",
    },
  },
  validation: {
    selects: {
      pos: [null, "1", "2", "3"],
      roles: ["Guest", "User", "Admin"],
      statuses: ["Completed", "In Progress"],
      storeNumbers: [],
      incidentTypes: [],
      incidentTransactionTypes: [],
      users: [],
    },
    defaultProfilePicture: "/img/default_profile_picture.jpg",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    cookie: { expiresIn: process.env.JWT_COOKIE_EXPIRES_IN },
  },
  webhook: {
    microsoftTeams: {
      url: process.env.MS_TEAMS_WEBHOOK_URL,
    },
  },
  misc: {
    defaultProfilePicture: "/img/default_profile_picture.jpg",
  },
  port,
  version: process.env.npm_package_version,
};

export default config;

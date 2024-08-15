const config = {
  port: process.env.SERVER_PORT, // Server Port
  version: process.env.npm_package_version, // App version
  rateLimiter: {
    maxNumberOfRequests: 50, // Max number of requests before a client is restricted to make another request
    windowMilliseconds: 60000, // How long before a client is eligible to make another request in milliseconds
    message: "Too many request from this IP, please try again later!", // error message when rate limit is reached
  },
  logs: {
    morgan: {
      format:
        ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    },
    winston: {
      timestampFormat: "YYYY-MMM-DD HH:mm:ss.SSS", // 2024-Aug-14 09:12:01.342
      label: process.env.npm_package_version,
      cli: {
        colorize: { level: false, all: true },
        format: ({ timestamp, level, label, message, ...data }) =>
          `[${timestamp}] [${level}] (${label}): ${message}`, // [2024-Aug-14 01:13:00.006] [INFO] (1.0.0): Message
      },
      http: {
        filename: "server-http-logs-%DATE%.log", // file name includes current date
        dirname: "backend/logs/http", // directory name where include the log file
        datePattern: "YYYY-MMMM-DD", // current date pattern: YYYY-MMMM-DD -> 2024-August-31
        zippedArchive: false, // zip logs true/false
        maxSize: "20m", // rotate if file size exceeds 20 MB
      },
      general: {
        filename: "server-general-logs-%DATE%.log",
        dirname: "backend/logs/general",
        datePattern: "YYYY-MMMM-DD",
        zippedArchive: false,
        maxSize: "20m",
      },
      error: {
        filename: "server-error-logs-%DATE%.log",
        dirname: "backend/logs/error",
        datePattern: "YYYY-MMMM-DD",
        zippedArchive: false,
        maxSize: "20m",
      },
    },
  },
  request: {
    byteLimit: "2mb",
    type: "*/*",
    import: {
      reportCountLimit: 500, // 1 report is around 3 800 bytes. 3 800 bytes * 500 reports = 1,900,000 bytes or 1.9 MB
    },
    // object key values to obfuscate in the request body
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
};

if (process.env.NODE_ENV === "development") {
  config.port = 5049;
  config.logs.morgan.format = "dev";
}

export default config;

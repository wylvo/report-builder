import path from "path";
import { readFile, writeFile } from "fs/promises";

let port = process.env.SERVER_PORT;

// Instanciating Express' Server & Server Port
if (process.env.NODE_ENV === "development") port = 5049;

// Read package.json File
const pjsonFile = async () =>
  readFile(new URL("../../package.json", import.meta.url));
const pjsonVersion = JSON.parse(await pjsonFile()).version;

// Set Local Absolute Paths
const __dirname = path.resolve();

// Backup file
const backupFileName = `backup_${port}_v${pjsonVersion}.json`;
const backupFilePath = path.join(__dirname, `/frontend/${backupFileName}`);

const config = {
  backup: {
    file: {
      path: backupFilePath,
    },
  },
  rateLimter: {
    maxNumberOfRequests: 100, // Max number of requests before a client is restricted to make another request
    windowMiliseconds: 30000, // How long before a client is eligible to make another request
    message: "Too many request from this IP, please try again later!",
  },
  request: {
    byteLimit: "2mb",
    type: "*/*",
    import: {
      reportCountLimit: 500, // 1 report is around 3 800 bytes. 3 800 bytes * 500 reports = 1,900,000 bytes or 1.9 MB
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
  version: pjsonVersion,
};

export default config;

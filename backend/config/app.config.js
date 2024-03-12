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
  port,
  version: pjsonVersion,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    cookie: { expiresIn: process.env.JWT_COOKIE_EXPIRES_IN },
  },
  backup: {
    file: {
      path: backupFilePath,
    },
  },
};

export default config;

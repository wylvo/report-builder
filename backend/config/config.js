// Node Modules
import path from "path";
import { readFile, writeFile } from "fs/promises";

// Dependencies
import "dotenv/config";

const port = process.env.SERVER_PORT || 5050;

// Read package.json File
const pjsonFile = async () =>
  readFile(new URL("../../package.json", import.meta.url));
const pjsonVersion = JSON.parse(await pjsonFile()).version;

// Set Local Absolute Paths
const __dirname = path.resolve();
const backupFileName = `backup_${port}_v${pjsonVersion}.json`;
const backupFilePath = path.join(__dirname, `/frontend/${backupFileName}`);

const config = {
  port: port,
  version: pjsonVersion,
  backup: {
    file: {
      path: backupFilePath,
    },
  },
};

export default config;

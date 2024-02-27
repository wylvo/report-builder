// File imports
import * as webhook from "./webhook/webhook.js";
import * as card from "./webhook/card.js";

// Dependencies
import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";

// Node Modules
import { readFile, writeFile } from "fs/promises";
import path from "path";

// Read package.json File
export const pjsonVersion = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url))
).version;

// Instanciating Express' Server & Server Port
const server = express();
const router = express.Router();
const port = process.env.SERVER_PORT || 5050;

// Set Local Absolute Paths
const __dirname = path.resolve();
const backupFileName = `backup_${port}_v${pjsonVersion}.json`;
const backupFilePath = path.join(__dirname, `/frontend/${backupFileName}`);

// If backup file not existent, create/write a new empty backup file
export const backupFileExists = async () => {
  try {
    const file = await readFile(backupFilePath, "utf-8");
    if (!Object.hasOwn(JSON.parse(file), "reportsList"))
      throw new Error("reportsList object property not found.");
  } catch (error) {
    if (
      error.message.includes("ENOENT") ||
      error.message.includes("reportsList")
    )
      await writeFile(backupFilePath, `{"reportsList": []}`);
    else console.error(error);
  } finally {
    return readFile(backupFilePath, "utf-8");
  }
};

backupFileExists();

// Static Files
server.use(express.static(path.join(__dirname, "/frontend/public")));

// JSON Formats & Headers Compression, Security (Helmet) & CORS Headers
server.use(express.json({ limit: "50mb" }));
server.use(compression());
server.use(helmet());
server.use(cors());

// Format Json Responses As Text With Spaces
server.set("json spaces", 2);

// Get App Version
server.get("/api/version", (_, res) => {
  res.json({ version: pjsonVersion });
});

// Get Backup File Data
server.get("/api/backup", async (_, res) => {
  const backupFile = await backupFileExists();
  res.json(JSON.parse(backupFile)["reportsList"]);
});

// Post Report Data To Webhook URL Endpoint
server.post("/api/send", async (req, res) => {
  const report = req.body;

  try {
    // With Report Data: Format Webhook Adaptive Card & Send Webhook Request
    const webhookResponse = await webhook.send(card.setAdaptiveCard(report));

    // Send Webhook Response Back To The Client
    res.status(webhookResponse.status).json({
      webhookResponse: {
        statusCode: webhookResponse.status,
        statusText: webhookResponse.text(),
      },
      report: report,
    });
  } catch (error) {
    if (error.message.includes("fetch failed")) {
      if (error?.cause?.code === "UND_ERR_CONNECT_TIMEOUT")
        return res.status(504).json({}).end();
      if (error?.cause?.code === "ENOTFOUND")
        return res.status(502).json({}).end();
    }
    console.error(error);
    return res.status(500).json({}).end();
  }
});

// Read & Write Report Data To `./frontend/backup_${port}.json`
server.post("/api/backup", async (req, res) => {
  try {
    const reports = req.body;

    // Keep Track Of Backup Operations
    const operations = [];

    // Read The Backup File (`./frontend/backup_${port}.json`)
    const backup = JSON.parse(await backupFileExists());

    // For Each Report
    reports.forEach((report) => {
      // Find The Report In The Backup File By ID
      const index = backup["reportsList"].indexOf(
        backup["reportsList"].find(
          (backedUpReport) => backedUpReport.id === report.id
        )
      );

      // If Report Is Found Update The Report. Else, Add The Report In The Backup File
      let operation = "";
      index !== -1
        ? ((backup["reportsList"][index] = report), (operation = "Updated"))
        : (backup["reportsList"].unshift(report), (operation = "Added"));

      // Keep Track Of Backup Operations Per Report
      operations.push({
        report,
        operation: operation,
      });
    });

    // Write To The Backup File (`./frontend/backup_${port}.json`)
    await writeFile(backupFilePath, JSON.stringify(backup, undefined, 2));

    // Send Response Back To Client With Added Details (Operations)
    res.status(200).json({
      message: "Report(s) backed up successfully.",
      location: "/api/backup",
      operations: operations,
      backup: reports,
    });
  } catch (error) {
    throw error;
  }
});

// Listen On Specified Port Number
server.listen(port, () =>
  console.log(`Server listening on port ${port} at: http://localhost:${port}`)
);

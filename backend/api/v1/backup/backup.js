import { readFile, writeFile } from "fs/promises";

import { config } from "../router.js";

// If backup file not existent, create/write a new empty backup file
const backupFileExists = async () => {
  try {
    const file = await readFile(config.backup.file.path, "utf-8");
    if (!Object.hasOwn(JSON.parse(file), "reportsList"))
      throw new Error("reportsList object property not found.");
  } catch (error) {
    if (
      error.message.includes("ENOENT") ||
      error.message.includes("reportsList")
    )
      await writeFile(config.backup.file.path, `{"reportsList": []}`);
    else console.error(error);
  } finally {
    return readFile(config.backup.file.path, "utf-8");
  }
};

backupFileExists();

// Get Backup File Data
export const getBackup = async (_, res) => {
  const backupFile = await backupFileExists();
  const reports = JSON.parse(backupFile)["reportsList"];

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: { ...reports },
  });
};

// Read & Write Report Data To `./frontend/backup_${port}.json`
export const updateBackup = async (req, res) => {
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

      // If Report Is Found Update The Reports. Else, Add The Report In The Backup File
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
    await writeFile(
      config.backup.file.path,
      JSON.stringify(backup, undefined, 2)
    );

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
};

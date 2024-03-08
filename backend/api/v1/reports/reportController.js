import { readFile } from "fs/promises";

import config from "../../../config/app.config.js";

export const getAllReports = async (req, res, next) => {
  const backupFile = await readFile(config.backup.file.path, "utf-8");
  const reports = JSON.parse(backupFile)["reportsList"];

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: { ...reports },
  });
};

export const createReport = async (req, res, next) => {
  res.status(200).json({
    route: "/createReport",
  });
};

export const getReport = async (req, res, next) => {
  res.status(200).json({
    route: "/getReport",
  });
};

export const updateReport = async (req, res, next) => {
  res.status(200).json({
    route: "/updateReport",
  });
};

export const deleteReport = async (req, res, next) => {
  res.status(200).json({
    route: "/deleteReport",
  });
};

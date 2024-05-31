import express from "express";

import * as report from "../report.controller.js";

const router = express.Router();

/** ROUTE restricted to "User" role
 * /api/v1/reports/import (POST)
 */
router.post(
  "/",
  report.validateImport,
  report.validateUsernames,
  report.importReports
);

export { router as importRouter };

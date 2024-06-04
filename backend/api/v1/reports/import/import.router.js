import express from "express";

import * as report from "../report.controller.js";
import * as formData from "../../formData/formData.controller.js";

const router = express.Router();

/** ROUTE restricted to "User" role
 * /api/v1/reports/import (POST)
 */
router.post(
  "/",
  report.validateBodyIsArray,
  formData.synchonizeReportValidation,
  report.validateImport,
  report.validateCreatedAtAndUpdatedAt,
  report.validateUsernamesAndFilterDuplicates,
  report.importReports
);

export { router as importRouter };

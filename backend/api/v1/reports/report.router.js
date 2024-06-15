import express from "express";

import { importRouter } from "./import/import.router.js";
import { migrateRouter } from "./migrate/migrate.router.js";

import * as report from "./report.controller.js";
import * as auth from "../../../auth/auth.controller.js";
import * as formData from "../formData/formData.controller.js";

const router = express.Router();

// Handle report importation & report migration in a separate module
router.use("/import", importRouter);
router.use("/migrate", migrateRouter);

/** ROUTES (unrestricted)
 * /api/v1/reports                                (GET)
 * /api/v1/reports/:id                            (GET)
 * /api/v1/reports/softDeleted                    (GET)
 * /api/v1/reports/createdBy/:username            (GET)
 * /api/v1/reports/createdBySoftDeleted/:username (GET)
 */

router.get("/", report.getAllReports);
router.get("/softDeleted", report.getAllSoftDeletedReports);
router.get("/:id", report.getReport);
router.get("/createdBy/:username", report.getAllReportsCreatedByUser);
router.get(
  "/createdBySoftDeleted/:username",
  report.getAllReportsCreatedByUserSoftDeleted
);

/** ROUTES restricted to "User" & "Admin" roles
 * /api/v1/reports                                  (POST)
 * /api/v1/reports/:id                              (PUT)
 * /api/v1/reports/:id/softDelete                   (PUT)
 * /api/v1/reports/:id/undoSoftDelete               (PUT)
 */
router.use(auth.restrictTo("Admin", "User"));

router.post(
  "/",
  formData.synchonizeReportValidation,
  report.validateCreate,
  report.createReport
);
router.put(
  "/:id",
  formData.synchonizeReportValidation,
  report.validateUpdate,
  report.updateReport
);
router.put("/:id/softDelete", report.softDeleteReport);
router.put("/:id/softDeleteUndo", report.undoSoftDeleteReport);

/** ROUTE restricted to "Admin" role
 * /api/v1/reports/:id  (DELETE)
 */
router.use(auth.restrictTo("Admin"));

router.delete("/:id", report.validateHardDelete, report.deleteReport);

export { router as reportRouter };

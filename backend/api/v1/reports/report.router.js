import express from "express";

import { importRouter } from "./import/import.router.js";
import { migrateRouter } from "./migrate/migrate.router.js";

import * as report from "./report.controller.js";
import * as auth from "../../../auth/auth.controller.js";
import * as formData from "../formData/formData.controller.js";

const router = express.Router();

/** ROUTES
 * /api/v1/reports/:id                (DELETE)
 * /api/v1/reports/:id/softDelete     (PUT)
 * /api/v1/reports/:id/undoSoftDelete (PUT)
 * /api/v1/reports/softDeleted        (GET)
 */
router.delete("/:id", report.validateHardDelete, report.deleteReport);
router.put("/:id/softDelete", report.softDeleteReport);
router.put("/:id/softDeleteUndo", report.undoSoftDeleteReport);
router.get("/softDeleted", report.getAllSoftDeletedReports);

router.get("/createdBy/:username", report.getAllReportsCreatedByUser);
router.get(
  "/createdBySoftDeleted/:username",
  report.getAllReportsCreatedByUserSoftDeleted
);

/** ROUTES restricted to "user" role
 * /api/v1/reports      (GET & POST)
 * /api/v1/reports/:id  (GET & PUT)
 */
// router.use(auth.restrictTo("User"));
router
  .route("/")
  .get(report.getAllReports)
  .post(
    formData.synchonizeReportValidation,
    report.validateCreate,
    report.createReport
  );
router
  .route("/:id")
  .get(report.getReport)
  .put(
    formData.synchonizeReportValidation,
    report.validateUpdate,
    report.updateReport
  );

// Handle report importation & report migration in a separate module
router.use("/import", importRouter);
router.use("/migrate", migrateRouter);

export { router as reportRouter };

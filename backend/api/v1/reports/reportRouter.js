import express from "express";

import * as report from "./reportController.js";
import * as auth from "../../../auth/authController.js";

const router = express.Router();

/** ROUTES
 * /api/v1/reports/:id                (DELETE)
 * /api/v1/reports/:id/undoSoftDelete (PUT)
 * /api/v1/reports/softDeleted        (GET)
 */
router.delete("/:id", report.validateHardDelete, report.deleteReport);
router.put("/:id/undoSoftDelete", report.undoSoftDeleteReport);
router.get("/softDeleted", report.getAllSoftDeletedReports);

/** ROUTES restricted to "user" role
 * /api/v1/reports      (GET & POST)
 * /api/v1/reports/:id  (GET & PUT)
 */
// router.use(auth.restrictTo("user"));
router
  .route("/")
  .get(report.getAllReports)
  .post(report.validateCreate, report.createReport);
router
  .route("/:id")
  .get(report.getReport)
  .put(report.validateUpdate, report.updateReport);

export { router as reportRouter };

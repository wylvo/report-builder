import express from "express";

import * as report from "./reportController.js";
import * as auth from "../../../auth.js";

const router = express.Router();

router.get("/", report.getAllReports);
router.post("/", report.createReport);
router.get("/:id", report.getReport);
router.put("/:id", report.updateReport);
router.delete(
  "/:id",
  auth.protect,
  auth.restrictTo(["admin"]),
  report.deleteReport
);

export { router as reportRouter };

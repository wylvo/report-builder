import express from "express";

import * as report from "../report.controller.js";

const router = express.Router();

/** ROUTE restricted to "User" role
 * /api/v1/reports/migrate (POST)
 */
router.post("/", report.migrateReport);

export { router as migrateRouter };

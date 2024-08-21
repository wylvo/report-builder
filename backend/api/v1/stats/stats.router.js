import express from "express";

import * as stats from "./stats.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/stats (GET)
 */
router.get("/", stats.getAllStats);

export { router as statsRouter };

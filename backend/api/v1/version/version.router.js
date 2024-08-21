import express from "express";

import * as version from "./version.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/version (GET)
 */
router.get("/", version.getVersion);

export { router as versionRouter };

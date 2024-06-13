import express from "express";

import { userRouter } from "./users/user.router.js";
import { reportRouter } from "./reports/report.router.js";
import { webhookRouter } from "./webhook/webhook.router.js";
import { versionRouter } from "./version/version.router.js";
import { formDataRouter } from "./formData/formData.router.js";
import { storeRouter } from "./stores/store.router.js";
import { districtManagerRouter } from "./districtManagers/districtManager.router.js";
import * as auth from "../../auth/auth.controller.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(auth.protect);

// Mount all routes. Each route will handle its own sub routes
router.use("/users", userRouter); // - /api/v1/users
router.use("/reports", reportRouter); // - /api/v1/reports
router.use("/webhook", webhookRouter); // - /api/v1/webhook
router.use("/version", versionRouter); // - /api/v1/version
router.use("/formData", formDataRouter); // - /api/v1/formData
router.use("/stores", storeRouter); // - /api/v1/stores
router.use("/districtManagers", districtManagerRouter); // - /api/v1/districtManagers

export { mssql, mssqlDataTypes } from "../../config/db.config.js";
export { validateBody } from "../../validation/validation.js";
export { hashPassword } from "../../auth/auth.controller.js";
export { default as config } from "../../config/app.config.js";
export { default as dateISO8601 } from "../../date/dateISO8601.js";
export { default as catchAsync } from "../../errors/catchAsync.js";
export { default as GlobalError } from "../../errors/globalError.js";
export { default as dateMSSharePoint } from "../../date/dateMSSharePoint.js";
export default router;

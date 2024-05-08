import express from "express";

import { userRouter } from "./users/userRouter.js";
import { reportRouter } from "./reports/reportRouter.js";
import { webhookRouter } from "./webhook/webhookRouter.js";
import { versionRouter } from "./version/versionRouter.js";
import { formDataRouter } from "./formData/formDataRouter.js";
import * as auth from "../../auth/authController.js";

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toLowerCase();
  });
};

const router = express.Router();

// Protect all routes after this middleware
router.use(auth.protect);

// Mount all routes. Each route will handle its own sub routes
router.use("/users", userRouter); // - /api/v1/users
router.use("/reports", reportRouter); // - /api/v1/reports
router.use("/webhook", webhookRouter); // - /api/v1/webhook
router.use("/version", versionRouter); // - /api/v1/version
router.use("/formData", formDataRouter); // - /api/v1/formData

export default router;
export { mssql, mssqlDataTypes } from "../../config/db.config.js";
export { default as config } from "../../config/app.config.js";
export { default as dateISO8601 } from "../../date/dateISO8601.js";
export { default as catchAsync } from "../../errors/catchAsync.js";

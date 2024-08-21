import express from "express";

import * as activityLog from "./activityLog.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/activityLog/frontend   (GET)
 */
router.get("/frontend", activityLog.getAllActivityLogsFrontend);

/** ROUTE restricted to "Admin" role
 * /api/v1/activityLog            (GET)
 */
router.use(auth.restrictTo("Admin"));

router.get("/", activityLog.getAllActivityLogs);

export { router as activityLogRouter };

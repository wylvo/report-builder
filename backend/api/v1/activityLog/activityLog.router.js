import express from "express";

import * as activityLog from "./activityLog.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES restricted to "Admin" role
 * /api/v1/activityLog            (GET)
 * /api/v1/activityLog/frontend   (GET)
 */
// router.use(auth.restrictTo("Admin"));

router.get("/", activityLog.getAllActivityLogs);
router.get("/frontend", activityLog.getAllActivityLogsFrontend);

export { router as activityLogRouter };

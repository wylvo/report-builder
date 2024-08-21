import express from "express";

import * as authenticationLog from "./authenticationLog.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES restricted to "Admin" role
 * /api/v1/authenticationLog      (GET)
 */
router.use(auth.restrictTo("Admin"));

router.get("/", authenticationLog.getAllAuthenticationLogs);

export { router as authenticationLogRouter };

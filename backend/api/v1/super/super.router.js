import express from "express";

import * as superPass from "./super.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTE restricted to "Admin" role
 * /api/v1/super/resetSuperPassword (POST)
 */
router.use(auth.restrictTo("Admin"));

router.post(
  "/resetSuperPassword",
  superPass.validateResetSuperPassword,
  superPass.resetSuperPassword
);

export { router as superRouter };

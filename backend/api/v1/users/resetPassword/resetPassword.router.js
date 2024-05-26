import express from "express";

import * as user from "../user.controller.js";

const router = express.Router();

/** ROUTE restricted to "admin" role
 * /api/v1/users/:id/resetPassword  (POST)
 */
router.post("/", user.validateResetPassword, user.resetUserPassword);

export { router as resetPasswordRouter };

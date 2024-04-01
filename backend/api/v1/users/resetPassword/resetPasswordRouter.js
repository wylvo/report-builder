import express from "express";

import * as user from "../userController.js";

const router = express.Router();

/** ROUTE restricted to "admin" role
 * /api/v1/users/:id/resetPassword  (POST)
 */
router.post("/", user.resetUserPassword);

export { router as resetPasswordRouter };

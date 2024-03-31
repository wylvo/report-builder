import express from "express";

import { getUserId } from "./resetPassword/resetPasswordController.js";
import { resetPasswordRouter } from "./resetPassword/resetPasswordRouter.js";
import * as user from "./userController.js";
import * as auth from "../../../auth.js";

const router = express.Router();

/** ROUTE
 * /api/v1/users/me (GET)
 */
router.get("/me", user.getMe, user.getUser);

// Restrict the following routes to admin role after this middleware
// router.use(auth.restrictTo("admin"));

/** ROUTES
 * /api/v1/users/:id/resetPassword  (POST)
 * /api/v1/users                    (GET & POST)
 * /api/v1/users/:id                (GET, PUT & DELETE)
 */
router.use("/:id/resetPassword", getUserId, resetPasswordRouter);
router.route("/").get(user.getAllUsers).post(user.createUser);
router
  .route("/:id")
  .get(user.getUser)
  .put(user.updateUser)
  .delete(user.deleteUser);

export { router as userRouter };

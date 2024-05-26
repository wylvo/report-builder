import express from "express";

import { resetPasswordRouter } from "./resetPassword/resetPassword.router.js";
import * as user from "./user.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTE
 * /api/v1/users/me       (GET)
 * /api/v1/users/frontend (GET)
 */
router.get("/me", user.getMe, user.getUser);
router.get("/frontend", user.getAllUsersFrontend);

// Restrict the following routes to admin role after this middleware
// router.use(auth.restrictTo("Admin"));

/** ROUTES restricted to "admin" role
 * /api/v1/users                    (GET & POST)
 * /api/v1/users/:id                (GET, PUT & DELETE)
 * /api/v1/users/:id/enable         (PUT)
 * /api/v1/users/:id/disable        (PUT)
 * /api/v1/users/:id/resetPassword  (POST)
 */

router
  .route("/")
  .get(user.getAllUsers)
  .post(user.validateCreate, user.createUser);
router
  .route("/:id")
  .get(user.getUser)
  .put(user.validateUpdate, user.updateUser)
  .delete(user.deleteUser);

router.put("/:id/enable", user.enableUser);
router.put("/:id/disable", user.disableUser);

// Handle password resets in separate module
router.use("/:id/resetPassword", user.getUserId, resetPasswordRouter);

export { router as userRouter };

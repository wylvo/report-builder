import express from "express";

import { resetPasswordRouter } from "./resetPassword/resetPassword.router.js";
import * as user from "./user.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/users/account  (GET)
 * /api/v1/users/frontend (GET)
 */
router.get("/account", user.getAccount);
router.get("/frontend", user.getAllUsersFrontend);

// Restrict the following routes to admin role after this middleware
router.use(auth.restrictTo("Admin"));

/** ROUTES restricted to "Admin" role
 * /api/v1/users                                  (GET & POST)
 * /api/v1/users/transferAllReportRelationships   (POST)
 * /api/v1/users/:username                        (GET, PUT & DELETE)
 * /api/v1/users/:username/enable                 (PUT)
 * /api/v1/users/:username/disable                (PUT)
 * /api/v1/users/:username/resetPassword          (POST)
 */

router
  .route("/")
  .get(user.getAllUsers)
  .post(user.validateCreate, user.createUser);

router.post(
  "/transferAllReportRelationships",
  user.validateTransferAllReportRelationshipsToUser,
  user.transferAllReportRelationshipsToUser
);

router.use("/:username", user.validateUsername);

router
  .route("/:username")
  .get(user.getUser)
  .put(user.validateUpdate, user.updateUser)
  .delete(user.deleteUser);

router.put("/:username/enable", user.enableUser);
router.put("/:username/disable", user.disableUser);

router.get(
  "/:username/reportRelationships",
  user.getUserReportRelationshipsByUser
);

// Handle password resets in separate module
router.use("/:username/resetPassword", resetPasswordRouter);

export { router as userRouter };

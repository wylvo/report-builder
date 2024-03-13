import { Router } from "express";
import { getVersion } from "./version/version.js";
import * as report from "./reports/reportController.js";
import * as user from "./users/userController.js";
import * as webhook from "./webhook/webhookController.js";
import * as backup from "./backup/backup.js";
import * as auth from "../../auth.js";

export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toLowerCase();
  });
};

const router = Router();

/**
 * Users
 */
router.get("/users", auth.protect, user.getAllUsers);
router.post("/users", user.createUser);
router.get("/users/:id", user.getUser);
router.put("/users/:id", user.updateUser);
router.delete(
  "/users/:id",
  auth.protect,
  auth.restrictTo(["admin"]),
  user.deleteUser
);

router.post("/users/:id/resetPassword", user.resetUserPassword);
router.post("/users/:id/signout", user.signOut);

/**
 * Reports
 */
router.get("/reports", report.getAllReports);
router.post("/reports", report.createReport);
router.get("/reports/:id", report.getReport);
router.put("/reports/:id", report.updateReport);
router.delete(
  "/reports/:id",
  auth.protect,
  auth.restrictTo(["admin"]),
  report.deleteReport
);

/**
 * Backup
 */
router.get("/backup", backup.getBackup);
router.post("/backup", backup.updateBackup);

/**
 * Webhook
 */
router.post("/webhook/:id", webhook.sendReportToWebhook);

/**
 * Version
 */
router.get("/version", getVersion);

export default router;

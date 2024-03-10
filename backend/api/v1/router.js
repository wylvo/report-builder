import { Router } from "express";
import { getVersion } from "./version/version.js";
import * as backup from "./backup/backup.js";
import * as report from "./reports/reportController.js";
import * as user from "./users/userController.js";
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
router.get("/users", user.getAllUsers);
router.post("/users", user.createUser);
router.get("/users/:id", user.getUser);
router.put("/users/:id", user.updateUser);
router.delete("/users/:id", user.deleteUser);

router.post("/users/signout", user.signOut);

/**
 * Reports
 */
router.get("/reports", report.getAllReports);
router.post("/reports", report.createReport);
router.get("/reports/:id", report.getReport);
router.put("/reports/:id", report.updateReport);
router.delete("/reports/:id", report.deleteReport);

/**
 * Backup
 */
router.get("/backup", backup.getBackup);
router.post("/backup", backup.updateBackup);

/**
 * Webhook
 */
router.post("/webhook/:id");

/**
 * Version
 */
router.get("/version", getVersion);

export default router;

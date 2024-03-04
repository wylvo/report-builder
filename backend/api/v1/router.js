import { Router } from "express";
import { getVersion } from "./version/version.js";
import * as backup from "./backup/backup.js";
import * as report from "./reports/reportController.js";
import * as user from "./users/userController.js";

const router = Router();

/**
 * Users
 */
router.get("/users", user.getAllUsers);
router.post("/users", user.createUser);
router.get("/users/:id", user.getUser);
router.put("/users/:id", user.updateUser);
router.delete("/users/:id", user.deleteUser);

router.post("/users/signin", user.signIn);
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

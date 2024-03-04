import { Router } from "express";
import { getVersion } from "./api/v1/version/version.js";
import { getBackup, updateBackup } from "./api/v1/backup/backup.js";

const router = Router();

/**
 * Users
 */
router.post("/signin");

/**
 * Reports
 */
router.get("/report", (req, res) => {
  res.json({ message: "success" });
});
router.get("/report/:id");
router.post("/report");
router.put("/report");
router.delete("/report");

/**
 * Backup
 */
router.get("/backup", getBackup);
router.post("/backup", updateBackup);

/**
 * Webhook
 */
router.post("/webhook/:id");

/**
 * Version
 */
router.get("/version", getVersion);

/**
 * Sign out
 */
router.post("/signout");

export default router;

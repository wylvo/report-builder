import { Router } from "express";
import { getVersion } from "./api/version/version.js";
import { getBackup, updateBackup } from "./api/backup/backup.js";

const router = Router();

/**
 * Report
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

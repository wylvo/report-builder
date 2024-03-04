import { Router } from "express";
import { getVersion } from "./version/version.js";
import { getBackup, updateBackup } from "./backup/backup.js";

const router = Router();

/**
 * Users
 */
router.get("/users");
router.post("/users");
router.post("/users/signin");
router.post("/users/signout");

/**
 * Reports
 */
router.get("/reports", (req, res) => {
  res.json({ message: "success" });
});
router.get("/reports/:id");
router.post("/reports");
router.put("/reports");
router.delete("/reports");

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

export default router;

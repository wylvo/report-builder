import express from "express";

import * as version from "./versionController.js";

const router = express.Router();

router.get("/", version.getVersion);

export { router as versionRouter };

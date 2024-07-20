import express from "express";

import * as stats from "./stats.controller.js";

const router = express.Router();

router.get("/", stats.getAllStats);

export { router as statsRouter };

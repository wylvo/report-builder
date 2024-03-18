import express from "express";

import * as webhook from "./webhookController.js";
import * as auth from "../../../auth.js";

const router = express.Router();

router.post("/:id", webhook.sendReportToWebhook);

export { router as webhookRouter };

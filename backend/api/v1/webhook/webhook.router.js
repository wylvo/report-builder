import express from "express";

import * as webhook from "./webhook.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/webhook/:id (POST)
 */
router.post("/:id", webhook.sendReportToIncomingWebhook);

export { router as webhookRouter };

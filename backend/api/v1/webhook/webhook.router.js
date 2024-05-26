import express from "express";

import * as webhook from "./webhook.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

router.post("/:id", webhook.sendReportToIncomingWebhook);

export { router as webhookRouter };

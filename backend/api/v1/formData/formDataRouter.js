import express from "express";

import { getFormData } from "./formDataController.js";

const router = express.Router();

/** ROUTE
 * /api/v1/formData (GET)
 */
router.get("/", getFormData);

export { router as formDataRouter };

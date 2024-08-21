import express from "express";

import * as formData from "./formData.controller.js";

const router = express.Router();

/** ROUTE unrestricted
 * /api/v1/formData (GET)
 */
router.get("/", formData.synchonizeFormData);

export { router as formDataRouter };

import express from "express";

import * as formData from "./formDataController.js";

const router = express.Router();

/** ROUTE
 * /api/v1/formData (GET)
 */
router.get("/", formData.synchonizeFormData);

export { router as formDataRouter };

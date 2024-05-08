import express from "express";

import { getAllFormDropdownSelectionFields } from "./formDataController.js";

const router = express.Router();

/** ROUTE
 * /api/v1/formData (GET)
 */
router.get("/", getAllFormDropdownSelectionFields);

export { router as formDataRouter };

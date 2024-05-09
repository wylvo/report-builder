import express from "express";

import { synchonizeFormData } from "./formDataController.js";

const router = express.Router();

/** ROUTE
 * /api/v1/formData (GET)
 */
router.get("/", synchonizeFormData);

export { router as formDataRouter };

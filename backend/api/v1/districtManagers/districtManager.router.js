import express from "express";

import * as districtManager from "./districtManager.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES unrestricted
 * /api/v1/districtManagers      (GET)
 * /api/v1/districtManagers/:id  (GET)
 */

router.get("/", districtManager.getAllDistrictManagers);
router.get("/:id", districtManager.getDistrictManager);

/** ROUTES restricted to "Admin" role
 * /api/v1/districtManagers      (POST)
 * /api/v1/districtManagers/:id  (GET, PUT & DELETE)
 */
router.use(auth.restrictTo("Admin"));

router
  .route("/")
  .post(districtManager.validateCreate, districtManager.createDistrictManager);

router
  .route("/:id")
  .put(districtManager.validateUpdate, districtManager.updateDistrictManager)
  .delete(districtManager.deleteDistrictManager);

export { router as districtManagerRouter };

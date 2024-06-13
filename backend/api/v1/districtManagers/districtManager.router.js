import express from "express";

import * as districtManager from "./districtManager.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES restricted to "Admin" role
 * /api/v1/districtManagers      (GET & POST)
 * /api/v1/districtManagers/:id  (GET, PUT & DELETE)
 */
// router.use(auth.restrictTo("Admin"));

router
  .route("/")
  .get(districtManager.getAllDistrictManagers)
  .post(districtManager.validateCreate, districtManager.createDistrictManager);

router
  .route("/:id")
  .get(districtManager.getDistrictManager)
  .put(districtManager.validateUpdate, districtManager.updateDistrictManager)
  .delete(
    districtManager.validateHardDelete,
    districtManager.deleteDistrictManager
  );

export { router as districtManagerRouter };

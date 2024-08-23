import express from "express";

import * as store from "./store.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES unrestricted
 * /api/v1/stores         (GET)
 * /api/v1/stores/:number (GET)
 */
router.get("/", store.getAllStores);
router.get("/:number", store.getStore);

/** ROUTES restricted to "Admin" role
 * /api/v1/stores         (GET & POST)
 * /api/v1/stores/:number (GET, PUT & DELETE)
 */
router.use(auth.restrictTo("Admin"));

router.route("/").post(store.validateCreate, store.createStore);

router
  .route("/:number")
  .get(store.getStore)
  .put(store.validateUpdate, store.updateStore)
  .delete(store.deleteStore);

export { router as storeRouter };

import express from "express";

import * as store from "./store.controller.js";
import * as auth from "../../../auth/auth.controller.js";

const router = express.Router();

/** ROUTES restricted to "Admin" role
 * /api/v1/stores      (GET & POST)
 * /api/v1/stores/:number  (GET, PUT & DELETE)
 */
router.use(auth.restrictTo("Admin"));

router
  .route("/")
  .get(store.getAllStores)
  .post(store.validateCreate, store.createStore);

router
  .route("/:number")
  .get(store.getStore)
  .put(store.validateUpdate, store.updateStore)
  .delete(store.deleteStore);

export { router as storeRouter };

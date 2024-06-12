import storeSchema from "./store.schema.js";

export const Stores = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A STORE     /api/v1/stores           (POST)
   * UPDATING A STORE     /api/v1/stores/:number   (PUT)
   **/
  validation: {
    create: storeSchema.create,
    update: storeSchema.update,
  },
};

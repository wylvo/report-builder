import districtManagerSchema from "./districtManager.schema.js";

export const DistrictManagers = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A DISTRICT MANAGER    /api/v1/districtManagers            (POST)
   * UPDATING A DISTRICT MANAGER    /api/v1/districtManagers/:username  (PUT)
   * DELETING A DISTRICT MANAGER    /api/v1/districtManagers/:username  (DELETE)
   **/
  validation: {
    create: districtManagerSchema.create,
    update: districtManagerSchema.update,
    delete: districtManagerSchema.delete,
  },
};

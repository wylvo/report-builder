import { mssql, mssqlDataTypes, config } from "../router.js";
import storeSchema from "./store.schema.js";

const { VarChar, NVarChar, Int, Bit } = mssqlDataTypes;

// Custom validation to check if district manager username exists in DB
export { isValidDistrictManagerUsername } from "../districtManagers/districtManager.model.js";

export const Stores = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A STORE     /api/v1/stores          (POST)
   * UPDATING A STORE     /api/v1/stores/:number  (PUT)
   * DELETING A STORE     /api/v1/stores/:number  (DELETE)
   **/
  validation: {
    create: storeSchema.create,
    update: storeSchema.update,
    hardDelete: storeSchema.hardDelete,
  },

  // GET SINGLE STORE BY ID
  async findById(id) {
    const {
      output: { store },
    } = await mssql()
      .request.input("id", Int, id)
      .output("store", NVarChar)
      .execute("api_v1_stores_getById");

    return JSON.parse(store);
  },

  // GET SINGLE STORE BY NUMBER
  async findByNumber(number) {
    const {
      output: { store },
    } = await mssql()
      .request.input("number", VarChar, number)
      .output("store", NVarChar)
      .execute("api_v1_stores_getByNumber");

    return JSON.parse(store);
  },

  // GET ALL STORES
  async all() {
    const {
      output: { store },
    } = await mssql()
      .request.output("store", NVarChar)
      .execute("api_v1_stores_getAll");

    const stores = JSON.parse(store);

    return !stores
      ? { results: 0, data: [] }
      : { results: stores.length, data: stores };
  },

  // CREATE A NEW STORE
  async create(body, districtManagerId) {
    body.active = body.active ?? true;

    const {
      output: { store },
    } = await mssql()
      .request.input("name", VarChar, body.name)
      .input("active", Bit, body.active)
      .input("number", VarChar, body.number)
      .input("numberDK", VarChar, body.numberDK)
      .input("address1", VarChar, body.address1)
      .input("address2", VarChar, body.address2)
      .input("city", VarChar, body.city)
      .input("state", VarChar, body.state)
      .input("zipcode", VarChar, body.zipcode)
      .input("country", VarChar, body.country)
      .input("phoneNumber", VarChar, body.phoneNumber)
      .input("districtManagerId", Int, districtManagerId)
      .output("store", NVarChar)
      .execute("api_v1_stores_create");

    return JSON.parse(store);
  },

  // UPDATE EXISTING STORE
  async update(body, store, districtManagerId) {
    const {
      output: { store: storeUpdated },
    } = await mssql()
      .request.input("storeId", Int, store.id)
      .input("name", VarChar, body.name)
      .input("active", Bit, body.active)
      .input("number", VarChar, body.number)
      .input("numberDK", VarChar, body.numberDK)
      .input("address1", VarChar, body.address1)
      .input("address2", VarChar, body.address2)
      .input("city", VarChar, body.city)
      .input("state", VarChar, body.state)
      .input("zipcode", VarChar, body.zipcode)
      .input("country", VarChar, body.country)
      .input("phoneNumber", VarChar, body.phoneNumber)
      .input("districtManagerId", Int, districtManagerId)
      .output("store", NVarChar)
      .execute("api_v1_stores_update");

    return JSON.parse(storeUpdated);
  },

  // DELETE AN EXISTING STORE **THIS ACTION IS IRREVERSIBLE**
  hardDelete(store) {
    return mssql()
      .request.input("storeId", Int, store.id)
      .execute("api_v1_stores_delete");
  },
};

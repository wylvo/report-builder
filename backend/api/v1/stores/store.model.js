import { mssql, mssqlDataTypes, config } from "../router.js";
import storeSchema from "./store.schema.js";

const { VARCHAR, NVARCHAR, INT, BIT } = mssqlDataTypes;

// Custom validation to check if a district manager username exists in DB
export { isValidDistrictManagerUsername } from "../districtManagers/districtManager.model.js";

export const Stores = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A STORE     /api/v1/stores          (POST)
   * UPDATING A STORE     /api/v1/stores/:number  (PUT)
   **/
  schema: {
    create: storeSchema.create,
    update: storeSchema.update,
  },

  // GET SINGLE STORE BY ID
  async findById(id) {
    const {
      output: { store },
    } = await mssql()
      .request.input("id", INT, id)
      .output("store", NVARCHAR)
      .execute("api_v1_stores_getById");

    return JSON.parse(store);
  },

  // GET SINGLE STORE BY NUMBER
  async findByNumber(number) {
    const {
      output: { store },
    } = await mssql()
      .request.input("number", VARCHAR, number)
      .output("store", NVARCHAR)
      .execute("api_v1_stores_getByNumber");

    return JSON.parse(store);
  },

  // GET SINGLE STORE BY EMAIL
  async findByEmail(email) {
    const {
      output: { store },
    } = await mssql()
      .request.input("email", VARCHAR, email)
      .output("store", NVARCHAR)
      .execute("api_v1_stores_getByEmail");

    return JSON.parse(store);
  },

  // GET ALL STORES
  async all(pageNumber, rowsPerPage) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 500 ? (rowsPerPage = 500) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { store, count },
    } = await mssql()
      .request.input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .output("store", NVARCHAR)
      .output("count", INT)
      .execute("api_v1_stores_getAll");

    const stores = JSON.parse(store);

    return !stores
      ? { total: 0, results: 0, data: [] }
      : { total: count, results: stores.length, data: stores };
  },

  // CREATE A NEW STORE
  async create(body, districtManagerId) {
    body.active = body.active ?? true;

    const {
      output: { store },
    } = await mssql()
      .request.input("name", VARCHAR, body.name)
      .input("active", BIT, body.active)
      .input("number", VARCHAR, body.number)
      .input("numberDK", VARCHAR, body.numberDK)
      .input("address1", VARCHAR, body.address1)
      .input("address2", VARCHAR, body.address2)
      .input("city", VARCHAR, body.city)
      .input("state", VARCHAR, body.state)
      .input("zipcode", VARCHAR, body.zipcode)
      .input("country", VARCHAR, body.country)
      .input("phoneNumber", VARCHAR, body.phoneNumber)
      .input("email", VARCHAR, body.email)
      .input("districtManagerId", INT, districtManagerId)
      .output("store", NVARCHAR)
      .execute("api_v1_stores_create");

    return JSON.parse(store);
  },

  // UPDATE EXISTING STORE
  async update(body, store, districtManagerId) {
    const {
      output: { store: storeUpdated },
    } = await mssql()
      .request.input("storeId", INT, store.id)
      .input("name", VARCHAR, body.name)
      .input("active", BIT, body.active)
      .input("number", VARCHAR, body.number)
      .input("numberDK", VARCHAR, body.numberDK)
      .input("address1", VARCHAR, body.address1)
      .input("address2", VARCHAR, body.address2)
      .input("city", VARCHAR, body.city)
      .input("state", VARCHAR, body.state)
      .input("zipcode", VARCHAR, body.zipcode)
      .input("country", VARCHAR, body.country)
      .input("phoneNumber", VARCHAR, body.phoneNumber)
      .input("email", VARCHAR, body.email)
      .input("districtManagerId", INT, districtManagerId)
      .output("store", NVARCHAR)
      .execute("api_v1_stores_update");

    return JSON.parse(storeUpdated);
  },

  // DELETE AN EXISTING STORE **THIS ACTION IS IRREVERSIBLE**
  hardDelete(store) {
    return mssql()
      .request.input("storeId", INT, store.id)
      .execute("api_v1_stores_delete");
  },
};

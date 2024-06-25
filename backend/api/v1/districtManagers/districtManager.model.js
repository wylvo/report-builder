import { mssql, mssqlDataTypes, config } from "../router.js";
import districtManagerSchema from "./districtManager.schema.js";

const { VARCHAR, NVARCHAR, INT } = mssqlDataTypes;

// Custom validation to check if a district manager username exists in DB
export const isDistrictManagerUsername = async (value, raiseError = true) => {
  const districtManager = await DistrictManagers.findByUsername(value);
  if (!districtManager && raiseError)
    throw new Error("username does not exist.");
  return districtManager;
};

// Custom validation to check if a district manager username exists in DB
export const isValidDistrictManagerUsername = async (value, { req }) => {
  const districtManager = await isDistrictManagerUsername(value);
  req.districtManagerId = districtManager.id;
  return true;
};

// Custom validation to check if new username does not exists in DB
export const isValidNewDistrictManagerUsername = async (value, { req }) => {
  const districtManager = await DistrictManagers.findByUsername(value);

  // If a districtManager is found with the username value
  // Then, the id present in the request has to match that exising districtManager id in the DB
  // Otherwise, this would trigger an error as it would allow duplicate usernames in the DB
  if (districtManager && String(districtManager.id) !== req.params.id)
    throw new Error();
  return true;
};

export const DistrictManagers = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * CREATING A DISTRICT MANAGER    /api/v1/districtManagers      (POST)
   * UPDATING A DISTRICT MANAGER    /api/v1/districtManagers/:id  (PUT)
   * DELETING A DISTRICT MANAGER    /api/v1/districtManagers/:id  (DELETE)
   **/
  validation: {
    create: districtManagerSchema.create,
    update: districtManagerSchema.update,
    hardDelete: districtManagerSchema.hardDelete,
  },

  // GET SINGLE DISTRICT MANAGER BY ID
  async findById(id) {
    const {
      output: { districtManager },
    } = await mssql()
      .request.input("id", INT, id)
      .output("districtManager", NVARCHAR)
      .execute("api_v1_districtManagers_getById");

    return JSON.parse(districtManager);
  },

  // GET SINGLE DISTRICT MANAGER BY USERNAME
  async findByUsername(username) {
    const {
      output: { districtManager },
    } = await mssql()
      .request.input("username", VARCHAR, username)
      .output("districtManager", NVARCHAR)
      .execute("api_v1_districtManagers_getByUsername");

    return JSON.parse(districtManager);
  },

  // GET ALL DISTRICT MANAGERS
  async all(pageNumber = 1, rowsPerPage = 200) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 200 ? (rowsPerPage = 200) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { districtManager, count },
    } = await mssql()
      .request.output("districtManager", NVARCHAR)
      .output("count", INT)
      .input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .execute("api_v1_districtManagers_getAll");

    const districtManagers = JSON.parse(districtManager);

    return !districtManagers
      ? { total: 0, results: 0, data: [] }
      : {
          total: count,
          results: districtManagers.length,
          data: districtManagers,
        };
  },

  // CREATE A NEW DISTRICT MANAGER
  async create(body) {
    body.profilePictureURI =
      body.profilePictureURI ?? config.validation.defaultProfilePicture;

    const {
      output: { districtManager },
    } = await mssql()
      .request.input("fullName", VARCHAR, body.fullName)
      .input("username", VARCHAR, body.username)
      .input("profilePictureURI", NVARCHAR, body.profilePictureURI)
      .output("districtManager", NVARCHAR)
      .execute("api_v1_districtManagers_create");

    return JSON.parse(districtManager);
  },

  // UPDATE EXISTING DISTRICT MANAGER
  async update(body, districtManager) {
    body.profilePictureURI =
      body.profilePictureURI ?? config.validation.defaultProfilePicture;

    const {
      output: { districtManager: districtManagerUpdated },
    } = await mssql()
      .request.input("districtManagerId", INT, districtManager.id)
      .input("fullName", VARCHAR, body.fullName)
      .input("username", VARCHAR, body.username)
      .input("profilePictureURI", NVARCHAR, body.profilePictureURI)
      .output("districtManager", NVARCHAR)
      .execute("api_v1_districtManagers_update");

    return JSON.parse(districtManagerUpdated);
  },

  // DELETE AN EXISTING DISTRICT MANAGER **THIS ACTION IS IRREVERSIBLE**
  hardDelete(districtManager) {
    return mssql()
      .request.input("districtManagerId", INT, districtManager.id)
      .execute("api_v1_districtManagers_delete");
  },
};

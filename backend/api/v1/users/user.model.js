import userValidationSchema from "./user.schema.js";
import { mssql, hashPassword, config, mssqlDataTypes } from "../router.js";
const { INT, NVARCHAR, VARCHAR, BIT } = mssqlDataTypes;

// Custom validation to check if username exists in DB
export const isUsername = async (value, raiseError = true) => {
  const user = await Users.findByUsername(value);
  if (!user && raiseError) throw new Error("username does not exist.");
  return user;
};

// Custom validation to check if username exists in DB & and if user is active
export const isActiveUsername = async (value, raiseError = true) => {
  const user = await isUsername(value);
  if (user && !user.active && raiseError) throw new Error("user is inactive.");
  return user;
};

// Custom validation to check if username exists in DB & and user is active
export const isValidUsername = async (value, { req }) => {
  const user = await isActiveUsername(value);
  req.assignedTo = user.id;
  return true;
};

// Custom validation to check if new username does not exists in DB
export const isValidNewUsername = async (value, { req }) => {
  const user = await Users.findByUsername(value);

  // If a user is found with the username value
  // Then, the id present in the request has to match that exising user id in the DB
  // Otherwise, this would trigger an error as it would allow duplicate usernames in the DB
  if (user && String(user.id) !== req.params.id) throw new Error();
  return true;
};

export const Users = {
  /**
   * MIDDLEWARE VALIDATION BEFORE:
   * SIGNING IN A USER          /signin                         (POST)
   * CREATING A USER            /api/v1/users                   (POST)
   * UPDATING A USER            /api/v1/users/:id               (PUT)
   * RESETTING A USER PASSWORD  /api/v1/users/:id/resetPassword (POST)
   **/
  schema: {
    signIn: userValidationSchema.signIn,
    create: userValidationSchema.create,
    update: userValidationSchema.update(),
    resetPassword: userValidationSchema.resetPassword(),
  },

  // GET SINGLE USER BY ID
  async findById(id) {
    const {
      output: { user },
    } = await mssql()
      .request.input("id", INT, id)
      .output("user", NVARCHAR)
      .execute("api_v1_users_getById");

    return JSON.parse(user);
  },

  // GET SINGLE USER BY EMAIL
  async findByEmail(email) {
    const {
      output: { user },
    } = await mssql()
      .request.input("email", VARCHAR, email)
      .output("user", NVARCHAR)
      .execute("api_v1_users_getByEmail");

    return JSON.parse(user);
  },

  // GET SINGLE USER BY USERNAME
  async findByUsername(username) {
    const {
      output: { user },
    } = await mssql()
      .request.input("username", VARCHAR, username)
      .output("user", NVARCHAR)
      .execute("api_v1_users_getByUsername");

    return JSON.parse(user);
  },

  // GET USER REPORT RELATIONSHIPS BY USER ID
  async reportRelationshipsByUserId(id) {
    const {
      output: { reports },
    } = await mssql()
      .request.input("id", INT, id)
      .output("reports", NVARCHAR)
      .execute("api_v1_users_getReportRelationshipsByUserId");

    return JSON.parse(reports);
  },

  // GET ALL USERS
  async all(pageNumber = 1, rowsPerPage = 200, frontend = false) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 200 ? (rowsPerPage = 200) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { user, count },
    } = await mssql()
      .request.input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .output("user", NVARCHAR)
      .output("count", INT)
      .execute(
        frontend ? "api_v1_users_getAllFrontend" : "api_v1_users_getAll"
      );

    const users = JSON.parse(user);

    return !users
      ? { total: 0, results: 0, data: [] }
      : { total: count, results: users.length, data: users };
  },

  // CREATE A NEW USER
  async create(body) {
    body.password = await hashPassword(body.password);
    body.active = body.active ?? true;
    body.profilePictureURI =
      body.profilePictureURI ?? config.validation.defaultProfilePicture;
    body.initials = body.initials?.toUpperCase() ?? null;

    const {
      output: { user },
    } = await mssql()
      .request.input("role", VARCHAR, body.role)
      .input("active", BIT, body.active)
      .input("email", VARCHAR, body.email)
      .input("password", VARCHAR, body.password)
      .input("profilePictureURI", NVARCHAR, body.profilePictureURI)
      .input("fullName", VARCHAR, body.fullName)
      .input("username", VARCHAR, body.username)
      .input("initials", VARCHAR, body.initials)
      .output("user", NVARCHAR)
      .execute("api_v1_users_create");

    return JSON.parse(user);
  },

  // UPDATE EXISTING USER
  async update(body, user) {
    body.profilePictureURI =
      body.profilePictureURI ?? config.validation.defaultProfilePicture;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", INT, user.id)
      .input("role", VARCHAR, body.role)
      .input("active", BIT, body.active)
      .input("email", VARCHAR, body.email)
      .input("profilePictureURI", NVARCHAR, body.profilePictureURI)
      .input("fullName", VARCHAR, body.fullName)
      .input("username", VARCHAR, body.username)
      .input("initials", VARCHAR, body.initials)
      .output("user", NVARCHAR)
      .execute("api_v1_users_update");

    return JSON.parse(userUpdated);
  },

  // DELETE AN EXISTING USER **THIS ACTION IS IRREVERSIBLE**
  delete(user) {
    return mssql()
      .request.input("userId", user.id)
      .execute("api_v1_users_delete");
  },

  // ENABLE A USER
  async enable(user) {
    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", INT, user.id)
      .output("user", NVARCHAR)
      .execute("api_v1_users_enable");

    return JSON.parse(userUpdated);
  },

  // DISABLE A USER
  async disable(user) {
    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", INT, user.id)
      .output("user", NVARCHAR)
      .execute("api_v1_users_disable");

    return JSON.parse(userUpdated);
  },

  async resetPassword(body, user) {
    // Set new password
    user.password = await hashPassword(body.password);
    body = undefined;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", INT, user.id)
      .input("password", VARCHAR, user.password)
      .execute("api_v1_users_update_password");
  },
};

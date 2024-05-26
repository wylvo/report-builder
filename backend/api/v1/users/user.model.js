import userValidationSchema from "./user.schema.js";
import { mssql, hashPassword, config, mssqlDataTypes } from "../router.js";

// Custom validation to check if username exists in DB & and user is active
export const isValidUsername = async (value, { req }) => {
  const user = await Users.findByUsername(value);
  if (!user) throw new Error("username does not exist.");
  if (user && !user.active) throw new Error("user is inactive.");
  req.assignedTo = user.id;
  return true;
};

// Custom validation to check if new username does not exists in DB
export const isValidNewUsername = async (value, { req }) => {
  const user = await Users.findByUsername(value);

  // If a user is found with the username value
  // Then, the id present in the request has to match that exising user id in the DB
  // Otherwise, this would trigger an error as it would allow duplicate usernames in the DB
  if (user && user.id !== req.params.id) throw new Error();
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
    const { Int, NVarChar } = mssqlDataTypes;

    const {
      output: { user },
    } = await mssql()
      .request.input("id", Int, id)
      .output("user", NVarChar)
      .execute("api_v1_users_getById");

    return JSON.parse(user);
  },

  // GET SINGLE USER BY EMAIL
  async findByEmail(email) {
    const { VarChar, NVarChar } = mssqlDataTypes;

    const {
      output: { user },
    } = await mssql()
      .request.input("email", VarChar, email)
      .output("user", NVarChar)
      .execute("api_v1_users_getByEmail");

    return JSON.parse(user);
  },

  // GET SINGLE USER BY USERNAME
  async findByUsername(username) {
    const { VarChar, NVarChar } = mssqlDataTypes;

    const {
      output: { user },
    } = await mssql()
      .request.input("username", VarChar, username)
      .output("user", NVarChar)
      .execute("api_v1_users_getByUsername");

    return JSON.parse(user);
  },

  // GET ALL USERS
  async all(frontend = false) {
    const { NVarChar } = mssqlDataTypes;

    const {
      output: { user },
    } = await mssql()
      .request.output("user", NVarChar)
      .execute(
        frontend ? "api_v1_users_getAllFrontend" : "api_v1_users_getAll"
      );

    const users = JSON.parse(user);

    return users;
  },

  // CREATE A NEW USER
  async create(body) {
    const { VarChar, Bit, NVarChar } = mssqlDataTypes;

    body.password = await hashPassword(body.password);
    body.active = body.active ?? true;
    body.profilePictureURI =
      body.profilePictureURI ?? config.misc.defaultProfilePicture;
    body.initials = body.initials?.toUpperCase() ?? null;

    const {
      output: { user },
    } = await mssql()
      .request.input("role", VarChar, body.role)
      .input("active", Bit, body.active)
      .input("email", VarChar, body.email)
      .input("password", VarChar, body.password)
      .input("profilePictureURI", NVarChar, body.profilePictureURI)
      .input("fullName", VarChar, body.fullName)
      .input("username", VarChar, body.username)
      .input("initials", VarChar, body.initials)
      .output("user", NVarChar)
      .execute("api_v1_users_create");

    return JSON.parse(user);
  },

  // UPDATE EXISTING USER
  async update(body, user) {
    const { Int, VarChar, Bit, NVarChar } = mssqlDataTypes;

    body.profilePictureURI =
      body.profilePictureURI ?? config.misc.defaultProfilePicture;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", Int, user.id)
      .input("role", VarChar, body.role)
      .input("active", Bit, body.active)
      .input("email", VarChar, body.email)
      .input("profilePictureURI", NVarChar, body.profilePictureURI)
      .input("fullName", VarChar, body.fullName)
      .input("username", VarChar, body.username)
      .input("initials", VarChar, body.initials)
      .output("user", NVarChar)
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
    const { Int, NVarChar } = mssqlDataTypes;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", Int, user.id)
      .output("user", NVarChar)
      .execute("api_v1_users_enable");

    return JSON.parse(userUpdated);
  },

  // DISABLE A USER
  async disable(user) {
    const { Int, NVarChar } = mssqlDataTypes;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", Int, user.id)
      .output("user", NVarChar)
      .execute("api_v1_users_disable");

    return JSON.parse(userUpdated);
  },

  async resetPassword(body, user) {
    const { Int, VarChar } = mssqlDataTypes;

    // Set new password
    user.password = await hashPassword(body.password);
    body = undefined;

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("userId", Int, user.id)
      .input("password", VarChar, user.password)
      .execute("api_v1_users_update_password");
  },
};

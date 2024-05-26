import userValidationSchema from "./userValidationSchema.js";
import { mssql, hashPassword, config, mssqlDataTypes } from "../router.js";
import { NVarChar } from "msnodesqlv8";

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

  async create(body) {
    const {
      role,
      active,
      email,
      password,
      profilePictureURI,
      fullName,
      username,
      initials,
    } = body;

    const {
      recordset: [user],
    } = await mssql()
      .request.input("role", role)
      .input("active", active ?? true)
      .input("email", email)
      .input("password", await hashPassword(password))
      .input(
        "profilePictureURI",
        profilePictureURI ?? config.misc.defaultProfilePicture
      )
      .input("fullName", fullName)
      .input("username", username)
      .input("initials", initials.toUpperCase() ?? null)
      .query(this.query.insert());

    return user;
  },

  async update(body, user) {
    const { NVarChar } = mssqlDataTypes;

    if (!body.profilePictureURI)
      body.profilePictureURI = config.misc.defaultProfilePicture;

    const rawJSON = JSON.stringify([body]);

    const {
      output: { user: userUpdated },
    } = await mssql()
      .request.input("id", user.id)
      .input("role", body.role)
      .input("rawJSON", NVarChar, rawJSON)
      .output("user", NVarChar)
      .query(this.query.update());

    return userUpdated;
  },

  async delete(user) {
    return await mssql().request.input("id", user.id).query(this.query.delete);
  },

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

  /**
   *  ALL MS SQL SERVER QUERIES RELATED TO USERS
   **/
  query: {
    baseSelect: `
      u.id, u.createdAt, u.updatedAt, u.authenticationAt,
      u.passwordResetAt, r.role AS role, u.active, u.email,
      u.password, u.failedAuthenticationAttempts, u.profilePictureURI,
      u.fullName, u.username, u.initials
    `,

    // GET (READ) USER(S)
    byId() {
      return `
        SELECT
          ${this.baseSelect}
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = @id;
      `;
    },

    // CREATE USER
    insert() {
      return `
        DECLARE @role_id INT = (
          SELECT id
          FROM roles
          WHERE role = @role
        );
        
        INSERT INTO users
          (role_id, active, email, password, profilePictureURI, fullName, username, initials)
        VALUES
          (@role_id, @active, @email, @password, @profilePictureURI, @fullName, @username, @initials);

      `;
    },

    // UPDATE USER
    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update() {
      return `
        DECLARE @role_id INT = (
          SELECT id
          FROM roles
          WHERE role = @role
        );
        
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE users
        SET updatedAt = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time',
          role_id = ISNULL(@role_id, users.role_id),
          active = ISNULL(json.active, users.active),
          email = ISNULL(json.email, users.email),
          profilePictureURI = ISNULL(json.profilePictureURI, users.profilePictureURI),
          fullName = ISNULL(json.fullName, users.fullName),
          username = ISNULL(json.username, users.username),
          initials = ISNULL(json.initials, users.initials)
        FROM OPENJSON(@json)
        WITH (
          role_id INT,
          active BIT,
          email VARCHAR(64),
          profilePictureURI NVARCHAR(MAX),
          fullName VARCHAR(64),
          username VARCHAR(20),
          initials VARCHAR(2)
        ) AS json
        WHERE users.id = @id;
        
        ${this.byId()}
      `;
    },

    // DELETE USER
    delete: "DELETE FROM users WHERE id = @id;",

    // ENABLE USER
    enable() {
      return `
        UPDATE users
        SET active = 1,
        updatedAt = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE id = @id;

        ${this.byId()}
      `;
    },

    // DISABLE USER
    disable() {
      return `
        UPDATE users
        SET active = 0,
        updatedAt = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE id = @id;

        ${this.byId()}
      `;
    },
  },
};

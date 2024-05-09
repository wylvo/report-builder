import userValidationSchema from "./userValidationSchema.js";
import { mssql } from "../router.js";

// Custom validation to check if username exists in DB & and user is active
export const isValidUsername = async (value, { req }) => {
  const user = await User.findByUsername(value);
  if (!user) throw new Error("username does not exist.");
  if (user && !user.active) throw new Error("user is inactive.");
  req.assignedTo = user.id;
  return true;
};

// Custom validation to check if new username does not exists in DB
export const isValidNewUsername = async (value, { req }) => {
  const user = await User.findByUsername(value);

  // If a user is found with the username value
  // Then, the id present in the request has to match that exising user id in the DB
  // Otherwise, this would trigger an error as it would allow duplicate usernames in the DB
  if (user && user.id !== req.params.id) throw new Error();
  return true;
};

export const User = {
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
    update: userValidationSchema.update,
    resetPassword: userValidationSchema.resetPassword(),
  },

  findBy: async (input, value, query) => {
    const {
      recordset: [user],
    } = await mssql().input(input, value).query(query);

    return user;
  },

  findByUUID: async (uuid) => {
    const {
      recordset: [user],
    } = await mssql().input("uuid", uuid).query(User.query.byUUID());

    return user;
  },

  findById: async (id) => {
    const {
      recordset: [user],
    } = await mssql().input("id", id).query(User.query.byId());

    return user;
  },

  findByEmail: async (email) => {
    const {
      recordset: [user],
    } = await mssql().input("email", email).query(User.query.byEmail());

    return user;
  },

  findByUsername: async (username) => {
    const {
      recordset: [user],
    } = await mssql()
      .input("username", username)
      .query(User.query.byUsername());

    return user;
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

    byUUID() {
      return `
        SELECT
          ${this.baseSelect}
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.uuid = @uuid;
      `;
    },

    byEmail() {
      return `
        SELECT
          ${this.baseSelect}
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE email = @email;
      `;
    },

    byUsername() {
      return `
        SELECT
          ${this.baseSelect}
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.username = @username;`;
    },

    all() {
      return `
        SELECT
          u.id, r.role AS role, u.active, u.email, u.profilePictureURI, u.fullName, u.username, u.initials
        FROM users u
        JOIN roles r ON r.id = u.role_id;
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

        ${this.byUsername()}
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

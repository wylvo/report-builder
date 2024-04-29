import userValidationSchema from "./userValidationSchema.js";
import { mssql } from "../../../config/db.config.js";

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
    } = await mssql().input("uuid", uuid).query(User.query.byUUID);

    return user;
  },

  findByEmail: async (email) => {
    const {
      recordset: [user],
    } = await mssql().input("email", email).query(User.query.byEmail);

    return user;
  },

  findByUsername: async (username) => {
    const {
      recordset: [user],
    } = await mssql().input("username", username).query(User.query.byUsername);

    return user;
  },

  /**
   *  ALL MS SQL SERVER QUERIES RELATED TO USERS
   **/
  query: {
    // GET (READ) USER(S)
    byUUID: "SELECT * FROM users WHERE uuid = @uuid;",
    byEmail: "SELECT * FROM users WHERE email = @email;",
    byUsername: "SELECT * FROM users WHERE username = @username;",
    all: "SELECT uuid, role, isEnabled, email, profilePictureURI, fullName, username, initials FROM users;",

    // CREATE USER
    insert() {
      return `
        INSERT INTO users
          (uuid, role, isEnabled, email, password, profilePictureURI, fullName, username, initials)
        VALUES
          (@uuid, @role, @isEnabled, @email, @password, @profilePictureURI, @fullName, @username, @initials);

        ${this.byUUID}
      `;
    },

    // UPDATE USER
    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update() {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE users
        SET lastUpdatedDateTime = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time',
          role = ISNULL(json.role, users.role),
          isEnabled = ISNULL(json.isEnabled, users.isEnabled),
          email = ISNULL(json.email, users.email),
          profilePictureURI = ISNULL(json.profilePictureURI, users.profilePictureURI),
          fullName = ISNULL(json.fullName, users.fullName),
          username = ISNULL(json.username, users.username),
          initials = ISNULL(json.initials, users.initials)
        FROM OPENJSON(@json)
        WITH (
          uuid VARCHAR(36),
          lastUpdatedDateTime DATETIMEOFFSET,
          role VARCHAR(64),
          isEnabled BIT,
          email VARCHAR(64),
          profilePictureURI NVARCHAR(MAX),
          fullName VARCHAR(64),
          username VARCHAR(20),
          initials VARCHAR(2)
        ) AS json
        WHERE users.uuid = @uuid;
        
        ${this.byUUID}
      `;
    },

    // DELETE USER
    delete: "DELETE FROM users WHERE uuid = @uuid;",

    // ENABLE USER
    enable() {
      return `
        UPDATE users
        SET isEnabled = 1,
        lastUpdatedDateTime = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE uuid = @uuid;

        ${this.byUUID}
      `;
    },

    // DISABLE USER
    disable() {
      return `
        UPDATE users
        SET isEnabled = 0,
        lastUpdatedDateTime = GETDATE() AT TIME ZONE 'UTC' AT TIME ZONE 'Eastern Standard Time'
        WHERE uuid = @uuid;

        ${this.byUUID}
      `;
    },
  },
};

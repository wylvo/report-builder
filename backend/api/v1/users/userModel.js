import { mssql } from "../../../config/db.config.js";

export const User = {
  findBy: async (table, query, value) => {
    const {
      recordset: [user],
    } = await mssql().input(table, value).query(query);

    return user;
  },

  findById: async (id) => {
    const {
      recordset: [user],
    } = await mssql().input("id", id).query(User.query.byId);

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

  query: {
    // GET (READ) USER(S)
    byId: "SELECT * FROM users WHERE id = @id;",
    byEmail: "SELECT * FROM users WHERE email = @email;",
    byUsername: "SELECT * FROM users WHERE username = @username;",
    all: "SELECT id, role, isEnabled, email, profilePictureURL, fullName, username, initials FROM users;",

    // CREATE USER
    insert() {
      return `
        INSERT INTO users
          (id, role, isEnabled, email, password, profilePictureURL, fullName, username, initials)
        VALUES
          (@id, @role, @isEnabled, @email, @password, @profilePictureURL, @fullName, @username, @initials);

        ${this.byId}
      `;
    },

    // UPDATE USER
    // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
    update() {
      return `
        DECLARE @json NVARCHAR(MAX) = @rawJSON;

        UPDATE users
        SET lastModifiedDateTime = GETDATE(),
          role = ISNULL(json.role, users.role),
          isEnabled = ISNULL(json.isEnabled, users.isEnabled),
          email = ISNULL(json.email, users.email),
          profilePictureURL = ISNULL(json.profilePictureURL, users.profilePictureURL),
          fullName = ISNULL(json.fullName, users.fullName),
          username = ISNULL(json.username, users.username),
          initials = ISNULL(json.initials, users.initials)
        FROM OPENJSON(@json)
        WITH (
          id VARCHAR(36),
          lastModifiedDateTime DATETIMEOFFSET,
          role VARCHAR(64),
          isEnabled BIT,
          email VARCHAR(64),
          profilePictureURL NVARCHAR(MAX),
          fullName VARCHAR(64),
          username VARCHAR(20),
          initials VARCHAR(2)
        ) AS json
        WHERE users.id = @id;
        
        ${this.byId}
      `;
    },

    // DELETE USER
    delete: "DELETE FROM users WHERE id = @id;",

    // ENABLE USER
    enable() {
      return `
        UPDATE users
        SET isEnabled = 1,
        lastModifiedDateTime = GETDATE()
        WHERE id = @id;

        ${this.byId}
      `;
    },

    // DISABLE USER
    disable() {
      return `
        UPDATE users
        SET isEnabled = 0,
        lastModifiedDateTime = GETDATE()
        WHERE id = @id;

        ${this.byId}
      `;
    },
  },

  schema: {
    /**
     *
     *  VALIDATION TO CREATE A USER
     *
     **/
    create: {
      role: {
        exists: { errorMessage: "Role is required.", bail: true },
        notEmpty: { errorMessage: "Role can't be empty.", bail: true },
        isIn: {
          options: [["guest", "user", "admin"]],
          errorMessage: "Invalid role. Only guest, user, or admin are allowed.",
        },
      },
      isEnabled: {
        optional: true,
        isBoolean: {
          options: { strict: true },
          errorMessage: "isEnabled should be a boolean (true or false).",
        },
      },
      email: {
        exists: { errorMessage: "Email is required.", bail: true },
        notEmpty: { errorMessage: "Email can't be empty.", bail: true },
        isEmail: { errorMessage: "Invalid e-mail address", bail: true },
        custom: {
          options: async (email) => {
            const user = await User.findByEmail(email);
            if (user) throw new Error();
          },
          errorMessage: "Email is already in use.",
        },
      },
      password: {
        exists: { errorMessage: "Password is required.", bail: true },
        notEmpty: { errorMessage: "Password can't be empty.", bail: true },
        isString: { errorMessage: "Password should be a string" },
      },
      passwordConfirmation: {
        exists: {
          errorMessage: "Password confirmation is required.",
          bail: true,
        },
        notEmpty: {
          errorMessage: "Password confirmation can't be empty.",
          bail: true,
        },
        custom: {
          options: (value, { req }) => {
            return value === req.body.password;
          },
          errorMessage: "Passwords do not match.",
        },
      },
      profilePictureURL: {
        optional: true,
        // isURL: { errorMessage: "Invalid profile picture URL" },
        isDataURI: { errorMessage: "Invalid profile picture data URI" },
      },
      fullName: {
        exists: { errorMessage: "Full name is required.", bail: true },
        notEmpty: { errorMessage: "Full name can't be empty.", bail: true },
        isString: { errorMessage: "Full name should be a string" },
      },
      username: {
        exists: { errorMessage: "Username is required.", bail: true },
        notEmpty: { errorMessage: "Username can't be empty.", bail: true },
        isString: { errorMessage: "Username should be a string", bail: true },
        custom: {
          options: async (username, { req }) => {
            const user = await User.findByUsername(username);
            if (user && user.id !== req.params.id) throw new Error();
            return user;
          },
          errorMessage: "Username is already in use.",
        },
      },
      initials: {
        optional: true,
        isString: { errorMessage: "Initials should be a string.", bail: true },
        isLength: {
          options: { max: 2 },
          errorMessage: "Invalid initials length, max 2 characters allowed.",
        },
      },
    },

    /**
     *
     *  VALIDATION TO UPDATE A USER
     *
     **/
    update: {
      role: {
        optional: true,
        notEmpty: { errorMessage: "Role can't be empty.", bail: true },
        isIn: {
          options: [["guest", "user", "admin"]],
          errorMessage: "Invalid role. Only guest, user, or admin are allowed.",
        },
      },
      isEnabled: {
        optional: true,
        isBoolean: {
          options: { strict: true },
          errorMessage: "isEnabled should be a boolean (true or false).",
        },
      },
      email: {
        optional: true,
        notEmpty: { errorMessage: "Email can't be empty.", bail: true },
        isEmail: { errorMessage: "Invalid e-mail address", bail: true },
        custom: {
          options: async (email, { req }) => {
            const user = await User.findByEmail(email);
            if (user && user.id !== req.params.id) throw new Error();
          },
          errorMessage: "Email is already in use.",
        },
      },
      profilePictureURL: {
        optional: true,
        // isURL: { errorMessage: "Invalid profile picture URL" },
        isDataURI: { errorMessage: "Invalid profile picture data URI" },
      },
      fullName: {
        optional: true,
        notEmpty: { errorMessage: "Full name can't be empty.", bail: true },
        isString: { errorMessage: "Full name should be a string" },
      },
      username: {
        optional: true,
        notEmpty: { errorMessage: "Username can't be empty.", bail: true },
        isString: { errorMessage: "Username should be a string", bail: true },
        custom: {
          options: async (username, { req }) => {
            const user = await User.findByUsername(username);
            if (user && user.id !== req.params.id) throw new Error();
            return user;
          },
          errorMessage: "Username is already in use.",
        },
      },
      initials: {
        optional: true,
        isString: { errorMessage: "Initials should be a string.", bail: true },
        isLength: {
          options: { max: 2 },
          errorMessage: "Invalid initials length, max 2 characters allowed.",
        },
      },
    },

    /**
     *
     *  VALIDATION TO RESET A USER PASSWORD
     *
     **/
    resetPassword() {
      return {
        password: this.create.password,
        passwordConfirmation: this.create.passwordConfirmation,
      };
    },
  },
};

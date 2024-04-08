import { body, checkSchema } from "express-validator";

// checkSchema({
//   image: {
//     isURL: { if: !body("profilePictureURL").isURL()},
//   },
// });

export const create = {
  role: {
    exists: { errorMessage: "Role is required.", bail: true },
    isIn: {
      options: [["guest", "user", "admin"]],
      errorMessage: "Invalid role. Only guest, user, or admin are allowed.",
    },
  },
  isEnabled: {
    optional: true,
    isBoolean: {
      errorMessage: "isEnabled should be a boolean (true or false).",
    },
  },
  email: {
    exists: { errorMessage: "Email is required.", bail: true },
    isEmail: { errorMessage: "Invalid e-mail address." },
  },
  password: {
    exists: { errorMessage: "Password is required.", bail: true },
    isString: { errorMessage: "Password should be a string." },
  },
  passwordConfirmation: {
    exists: { errorMessage: "Password confirmation is required.", bail: true },
    isString: { errorMessage: "Password confirmation should be a string." },
    custom: {
      options: (value, { req }) => {
        return value === req.body.password;
      },
    },
  },
  profilePictureURL: {
    optional: true,
    if: false,
    isURL: { errorMessage: "Invalid profile picture URL." },
    // isDataURI: { errorMessage: "Invalid profile picture data URI." },
  },
  fullName: {
    exists: { errorMessage: "Full name is required.", bail: true },
    isString: { errorMessage: "Full name should be a string." },
  },
  username: {
    exists: { errorMessage: "Username is required.", bail: true },
    isString: { errorMessage: "Username should be a string." },
  },
  initials: {
    optional: true,
    isString: { errorMessage: "Initials should be a string.", bail: true },
    isLength: {
      options: { min: 2, max: 2 },
      errorMessage: "Invalid initials length. Only 2 characters allowed.",
    },
  },
};

export default {
  getAll:
    "SELECT id, role, isEnabled, email, profilePictureURL, fullName, username, initials FROM users;",

  get: "SELECT * FROM users WHERE id = @id;",

  create: `
    INSERT INTO users
      (id, role, isEnabled, email, password, profilePictureURL, fullName, username, initials)
    VALUES
      (@id, @role, @isEnabled, @email, @password, @profilePictureURL, @fullName, @username, @initials);
  `,

  // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
  update: `
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
  `,

  delete: "DELETE FROM users WHERE id = @id;",

  enable: `
    UPDATE users
    SET isEnabled = 1,
    lastModifiedDateTime = GETDATE()
    WHERE id = @id;
  `,

  disable: `
    UPDATE users
    SET isEnabled = 0,
    lastModifiedDateTime = GETDATE()
    WHERE id = @id;
  `,
};

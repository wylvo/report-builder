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
    SET role = ISNULL(json.role, users.role),
      isEnabled = ISNULL(json.isEnabled, users.isEnabled),
      email = ISNULL(json.email, users.email),
      profilePictureURL ISNULL(json.profilePictureURL, users.profilePictureURL),
      fullName = ISNULL(json.fullName, users.fullName),
      username = ISNULL(json.username, users.username),
      initials = ISNULL(json.initials, users.initials)
    FROM OPENJSON(@json)
    WITH (
      id VARCHAR(36),
      role VARCHAR(64),
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
    SET isEnabled = 1
    WHERE id = @id;
  `,

  disable: `
    UPDATE users
    SET isEnabled = 0
    WHERE id = @id;
  `,
};

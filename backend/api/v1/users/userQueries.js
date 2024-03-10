export default {
  getAll: "SELECT * FROM users;",
  get: "SELECT * FROM users WHERE id = @id;",
  create: `INSERT INTO users (id, fullName, username, initials, email, password, role)
  VALUES (@id, @fullName, @username, @initials, @email, @password, @role);`,

  // Source: https://learn.microsoft.com/fr-fr/archive/blogs/sqlserverstorageengine/openjson-the-easiest-way-to-import-json-text-into-table#use-case-2-updating-table-row-using-json-object
  update: `
    DECLARE @json NVARCHAR(MAX) = @rawJSON;

    UPDATE users
    SET fullName = json.fullName,
      username = json.username,
      initials = json.initials,
      email = json.email,
      role = json.role
    FROM OPENJSON(@json)
    WITH (
      id VARCHAR(36),
      fullName VARCHAR(64),
      username VARCHAR(20),
      initials VARCHAR(2),
      email VARCHAR(64),
      role VARCHAR(64)
    ) AS json
    WHERE users.id = @id;
  `,
  delete: "DELETE FROM users WHERE id = @id;",
};

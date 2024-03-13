export default {
  update: `
    DECLARE @json NVARCHAR(MAX) = @rawJSON;

    UPDATE users
    SET password = json.password,
    passwordResetAt = json.passwordResetAt
    FROM OPENJSON(@json)
    WITH (
      password VARCHAR(64),
      passwordResetAt BIGINT
    ) AS json
    WHERE users.id = @id;
  `,
};

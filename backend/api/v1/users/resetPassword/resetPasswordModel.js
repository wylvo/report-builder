export default {
  update: `
    UPDATE users
    SET password = json.password,
    passwordResetAt = json.passwordResetAt
    FROM OPENJSON(@rawJSON)
    WITH (
      password VARCHAR(128),
      passwordResetAt DATETIMEOFFSET
    ) AS json
    WHERE users.id = @id;
  `,
};

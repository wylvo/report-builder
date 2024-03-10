export default {
  getAll: "SELECT * FROM users;",
  get: "SELECT * FROM users WHERE id = @id;",
  create:
    "INSERT INTO users (id, email, password, role) VALUES (@id, @email, @password, @role);",
  update: "",
  delete: "DELETE FROM users WHERE id = @id;",
};

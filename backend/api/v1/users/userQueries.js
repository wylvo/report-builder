export const getAllUsersQuery = "SELECT * FROM users;";
export const createUserQuery =
  "INSERT INTO users (id, email, password, role) VALUES (@id, @email, @password, @role);";
export const updateUser = "";
export const getUserQuery = "SELECT * FROM users WHERE id = @id;";
export const deleteUserQuery = "DELETE FROM users WHERE id = @id;";

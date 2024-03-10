import { signOut } from "./signOut/signOut.js";
import { hashPassword } from "../../../auth.js";
import { generateUUID } from "../router.js";
import catchAsync from "../../../errors/catchAsync.js";
import usersSQL from "./userQueries.js";

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;

  const { recordset: users } = await mssql.query(usersSQL.getAll);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const { NVarChar } = req.app.locals.mssqlDataTypes;
  const { fullName, username, initials, email, password, role } = req.body;
  const rawJSON = JSON.stringify(req.body);

  let {
    output: { user },
  } = await mssql
    .request()
    .input("id", generateUUID())
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("role", role)
    .output("user", NVarChar, rawJSON)
    .query(usersSQL.create);

  user = filterObj(
    JSON.parse(user),
    "id",
    "fullName",
    "username",
    "email",
    "role"
  );

  res.status(201).json({
    status: "success",
    message: "User created.",
    user,
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [user],
  } = await mssql.request().input("id", id).query(usersSQL.get);

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const { NVarChar } = req.app.locals.mssqlDataTypes;
  const id = req.params.id;

  const {
    recordset: [hasUser],
  } = await mssql.request().input("id", id).query(usersSQL.get);

  if (!hasUser) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }

  const rawJSON = JSON.stringify(req.body);

  let {
    output: { user },
  } = await mssql
    .request()
    .input("id", hasUser.id)
    .input("rawJSON", NVarChar, rawJSON)
    .output("user", NVarChar, rawJSON)
    .query(usersSQL.update);

  [user] = JSON.parse(user);

  res.status(201).json({
    status: "success",
    message: "User updated.",
    user,
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [user],
  } = await mssql.request().input("id", id).query(usersSQL.get);

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }
  await mssql.request().input("id", user.id).query(usersSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { signOut as signOut };

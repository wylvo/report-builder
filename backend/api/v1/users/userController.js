import { signOut } from "./signOut/signOut.js";
import { hashPassword } from "../../../auth.js";
import catchAsync from "../../../errors/catchAsync.js";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toLowerCase();
  });
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;

  const { recordset: users } = await mssql.query("SELECT * FROM users");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const { role, email, password } = req.body;

  const result = await mssql
    .request()
    .input("id", generateUUID())
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("role", role)
    .query(
      "INSERT INTO users (id, email, password, role) VALUES (@id, @email, @password, @role);"
    );

  res.status(201).json({
    status: "success",
    message: "User created.",
    result,
  });
});

export const getUser = async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [user],
  } = await mssql
    .request()
    .input("id", id)
    .query("SELECT * FROM users WHERE id = @id");

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
};

export const updateUser = async (req, res, next) => {
  res.status(200).json({
    route: "/updateUser",
  });
};

export const deleteUser = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [user],
  } = await mssql
    .request()
    .input("id", id)
    .query("SELECT id FROM users WHERE id = @id");

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }
  await mssql
    .request()
    .input("id", user.id)
    .query("DELETE FROM users WHERE id = @id");

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { signOut as signOut };

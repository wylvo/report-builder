import { resetUserPassword } from "./resetPassword/resetPasswordController.js";
import { hashPassword } from "../../../auth.js";
import { generateUUID } from "../router.js";
import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import catchAsync from "../../errors/catchAsync.js";
import GlobalError from "../../errors/globalError.js";
import usersSQL from "./userModel.js";

export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const mergeUserData = (id, obj) => {
  return [
    {
      id,
      ...filterObject(obj, "fullName", "username", "email", "initials", "role"),
    },
  ];
};

export const findUserByIdQuery = async (id) => {
  const {
    recordset: [user],
  } = await mssql().input("id", id).query(usersSQL.get);

  return user;
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { recordset: users } = await mssql().query(usersSQL.getAll);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const [
    {
      fullName,
      username,
      initials,
      email,
      password,
      passwordConfirmation,
      role,
    },
  ] = req.body;
  const id = generateUUID();

  if (!username || !email || !role)
    return next(
      new GlobalError("Please provide username, email, and role.", 400)
    );

  if (password !== passwordConfirmation)
    return next(new GlobalError("Passwords do not match.", 400));

  await mssql()
    .input("id", id)
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("role", role)
    .query(usersSQL.create);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user),
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(usersSQL.update);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await mssql().input("id", user.id).query(usersSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { resetUserPassword as resetUserPassword };

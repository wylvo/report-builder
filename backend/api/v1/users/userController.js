import { checkSchema } from "express-validator";

import { User } from "./userModel.js";
import { Report } from "../reports/reportModel.js";
import {
  resetUserPassword,
  validateResetPassword,
} from "./resetPassword/resetPasswordController.js";
import { hashPassword } from "../../../auth/authController.js";
import { generateUUID } from "../router.js";
import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import { validateBody } from "../../../validation/validation.js";
import catchAsync from "../../../errors/catchAsync.js";
import GlobalError from "../../../errors/globalError.js";

export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const filterUserData = (
  obj,
  reports = undefined,
  reportsDeleted = undefined
) => {
  return [
    {
      ...filterObject(
        obj,
        "id",
        "role",
        "isEnabled",
        "email",
        "profilePictureURI",
        "fullName",
        "username",
        "initials"
      ),
      ...(reports && { reports }),
      ...(reportsDeleted && { reportsDeleted }),
    },
  ];
};

export const getUserId = (req, res, next) => {
  req.userId = req.params.id;
  next();
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { recordset: users } = await mssql().query(User.query.all);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const validateCreate = validateBody(checkSchema, User.schema.create);

export const createUser = catchAsync(async (req, res, next) => {
  const {
    role,
    isEnabled,
    email,
    password,
    profilePictureURI,
    fullName,
    username,
    initials,
  } = req.body;
  const id = generateUUID();

  const {
    recordset: [user],
  } = await mssql()
    .input("id", id)
    .input("role", role)
    .input("isEnabled", isEnabled ?? true)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("profilePictureURI", profilePictureURI)
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials.toUpperCase() ?? null)
    .query(User.query.insert());

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  // prettier-ignore
  const [{ recordset: [reports]}, {recordset: [reportsDeleted]}] =
    await Promise.all([
      mssql()
        .input("username", user.username)
        .query(Report.query.byUsername()),
      mssql()
        .input("username", user.username)
        .query(Report.query.byUsernameSoftDeleted()),
    ]);

  res.status(200).json({
    status: "success",
    data: filterUserData(user, reports, reportsDeleted),
  });
});

export const validateUpdate = validateBody(checkSchema, User.schema.update);

export const updateUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  const { NVarChar } = mssqlDataTypes;
  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [userUpdated],
  } = await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(User.query.update());

  res.status(201).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await mssql().input("id", user.id).query(User.query.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const enableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.isEnabled === true)
    return next(
      new GlobalError(`User is already enabled with id: ${id}.`, 400)
    );

  const {
    recordset: [userUpdated],
  } = await mssql().input("id", user.id).query(User.query.enable());

  res.status(200).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
};

export const disableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.isEnabled === false)
    return next(
      new GlobalError(`User is already disabled with id: ${id}.`, 400)
    );

  const {
    recordset: [userUpdated],
  } = await mssql().input("id", user.id).query(User.query.disable());

  res.status(200).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export {
  resetUserPassword as resetUserPassword,
  validateResetPassword as validateResetPassword,
};

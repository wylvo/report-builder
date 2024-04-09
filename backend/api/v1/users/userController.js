import { validationResult, checkSchema } from "express-validator";

import { resetUserPassword } from "./resetPassword/resetPasswordController.js";
import { hashPassword } from "../../../auth.js";
import { generateUUID } from "../router.js";
import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import catchAsync from "../../errors/catchAsync.js";
import GlobalError from "../../errors/globalError.js";
import { User } from "./userModel.js";
import reportsSQL from "../reports/reportModel.js";

export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const mergeUserData = (
  id,
  obj,
  reports = undefined,
  reportsDeleted = undefined
) => {
  return [
    {
      id,
      ...filterObject(
        obj,
        "role",
        "isEnabled",
        "email",
        "profilePictureURL",
        "fullName",
        "username",
        "initials"
      ),
      reports: reports ? reports : [],
      reportsDeleted: reportsDeleted ? reportsDeleted : [],
    },
  ];
};

const myValidationResult = validationResult.withDefaults({
  formatter: (error) => error.msg,
});

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

export const validateCreate = catchAsync(async (req, res, next) => {
  await checkSchema(User.schema.create, ["body"]).run(req);
  const result = myValidationResult(req);

  if (result.errors.length) {
    return next(new GlobalError(result.mapped(), 400));
  }
  next();
});

export const createUser = catchAsync(async (req, res, next) => {
  const {
    role,
    isEnabled,
    email,
    password,
    passwordConfirmation,
    profilePictureURL,
    fullName,
    username,
    initials,
  } = req.body;
  const id = generateUUID();

  if (!username || !email || !role || (!password && !passwordConfirmation))
    return next(
      new GlobalError(
        "Please provide role, email, username, and password.",
        400
      )
    );

  if (password !== passwordConfirmation)
    return next(new GlobalError("Passwords do not match.", 400));

  await mssql()
    .input("id", id)
    .input("role", role)
    .input("isEnabled", isEnabled ?? true)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("profilePictureURL", profilePictureURL)
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials.toUpperCase())
    .query(User.query.insert);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, req.body),
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
        .query(reportsSQL.getAllByUsername()),
      mssql()
        .input("username", user.username)
        .query(reportsSQL.getSoftDeletedByUsername()),
    ]);

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user, reports, reportsDeleted),
  });
});

export const validateUpdate = catchAsync(async (req, res, next) => {
  await checkSchema(User.schema.update, ["body"]).run(req);
  const result = myValidationResult(req);

  if (result.errors.length) {
    return next(new GlobalError(result.mapped(), 400));
  }
  next();
});

export const updateUser = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  const {
    recordset: [userUpdated],
  } = await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(User.query.update());

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, userUpdated),
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
  } = await mssql().input("id", user.id).query(User.query.enable);

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, userUpdated),
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
  } = await mssql().input("id", user.id).query(User.query.enable());

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, userUpdated),
  });
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export { resetUserPassword as resetUserPassword };

import { checkSchema } from "express-validator";

import { Users } from "./user.model.js";
import { Reports } from "../reports/report.model.js";
import { validateBody, catchAsync, GlobalError } from "../router.js";

export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  if (!newObj.initials) newObj.initials = null;
  return newObj;
};

export const filterUserData = (obj) => {
  obj = filterObject(
    obj,
    "id",
    "createdAt",
    "updatedAt",
    "role",
    "active",
    "email",
    "profilePictureURI",
    "fullName",
    "username",
    "initials"
  );
  return obj;
};

export const getUserId = (req, res, next) => {
  req.userId = req.params.id;
  next();
};

export const getAllUsersFrontend = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const frontend = true;
  const { results, data } = await Users.all(page, rows, frontend);

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { results, data } = await Users.all(page, rows);

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Users.schema.create);

export const createUser = catchAsync(async (req, res, next) => {
  const user = await Users.create(req.body);

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: filterUserData(user /*, reports, reportsDeleted*/),
  });
});

export const validateUpdate = validateBody(checkSchema, Users.schema.update);

export const updateUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  if (Number(id) !== req.body.id)
    return next(
      new GlobalError(
        `Request body id value does match with the request parameter id value.`,
        400
      )
    );

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  const userUpdated = await Users.update(req.body, user);

  res.status(201).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await Users.delete(user);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const enableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.active === true)
    return next(new GlobalError(`User is already active with id: ${id}.`, 400));

  const userUpdated = await Users.enable(user);

  res.status(200).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
};

export const disableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.active === false)
    return next(
      new GlobalError(`User is already inactive with id: ${id}.`, 400)
    );

  const userUpdated = await Users.disable(user);

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
  resetUserPassword,
  validateResetPassword,
} from "./resetPassword/resetPassword.controller.js";

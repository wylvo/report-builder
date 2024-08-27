import { checkSchema } from "express-validator";

import { Users } from "./user.model.js";
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

export const validateUsername = catchAsync(async (req, res, next) => {
  const username = req.params.username;
  const raiseError = false;
  const user = await Users.isUsername(username, raiseError);

  if (!user)
    return next(
      new GlobalError(`User not found with username: ${username}.`, 404)
    );

  req.userFetched = user;

  next();
});

export const getAccount = catchAsync(async (req, res, next) => {
  const currentUserId = req.user.id;

  const user = await Users.findById(currentUserId);

  res.status(200).json({
    status: "success",
    data: filterUserData(user),
  });
});

export const getAllUsersFrontend = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const frontend = true;
  const { total, results, data } = await Users.all(page, rows, frontend);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { total, results, data } = await Users.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
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
  const user = req.userFetched; // from validateUsername()

  res.status(200).json({
    status: "success",
    data: filterUserData(user),
  });
});

export const validateUpdate = validateBody(checkSchema, Users.schema.update);

export const updateUser = catchAsync(async (req, res, next) => {
  const user = req.userFetched; // from validateUsername()

  const userUpdated = await Users.update(req.body, user);

  res.status(201).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const user = req.userFetched; // from validateUsername()
  const data = await Users.reportRelationshipsByUserId(user.id);

  if (data.reports > 0)
    return next(
      new GlobalError(
        `Unable to delete user: ${user.username}. Found ${data.reports} ${
          data.reports > 1 ? "reports" : "report"
        } related to this user.`,
        400
      )
    );

  await Users.delete(user);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const enableUser = catchAsync(async (req, res, next) => {
  const user = req.userFetched; // from validateUsername()

  if (user.active)
    return next(
      new GlobalError(`User: ${user.username} is already active.`, 400)
    );

  const userUpdated = await Users.enable(user);

  res.status(200).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
});

export const disableUser = catchAsync(async (req, res, next) => {
  const user = req.userFetched; // from validateUsername()

  if (!user.active)
    return next(
      new GlobalError(`User: ${user.username} is already inactive.`, 400)
    );

  const userUpdated = await Users.disable(user);

  res.status(200).json({
    status: "success",
    data: filterUserData(userUpdated),
  });
});

export const getUserReportRelationshipsByUser = catchAsync(
  async (req, res, next) => {
    const user = req.userFetched; // from validateUsername()

    const userReportRelationships = await Users.reportRelationshipsByUserId(
      user.id
    );

    res.status(200).json({
      status: "success",
      data: userReportRelationships,
    });
  }
);

export const validateTransferAllReportRelationshipsToUser = validateBody(
  checkSchema,
  Users.schema.transferAllReportRelationships
);

export const transferAllReportRelationshipsToUser = catchAsync(
  async (req, res, next) => {
    const { fromUsername, toUsername } = req.body;

    if (fromUsername === toUsername)
      return next(new GlobalError(`Usernames must be different.`, 400));

    const user = await Users.transferAllReportRelationshipsTo(
      req.fromUser,
      req.toUser
    );

    res.status(200).json({
      status: "success",
      data: user,
    });
  }
);

export {
  resetUserPassword,
  validateResetPassword,
} from "./resetPassword/resetPassword.controller.js";

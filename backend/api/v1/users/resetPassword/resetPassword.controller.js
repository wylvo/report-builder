import { checkSchema } from "express-validator";

import { Users } from "../user.model.js";
import { filterUserData } from "../user.controller.js";
import {
  mssql,
  mssqlDataTypes,
  hashPassword,
  catchAsync,
  GlobalError,
  validateBody,
} from "../../router.js";

export const validateResetPassword = validateBody(
  checkSchema,
  Users.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const id = req.userId;
  req.userId = undefined;
  req.body.passwordConfirmation = undefined;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await Users.resetPassword(req.body, user);

  req.body.password = undefined;

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

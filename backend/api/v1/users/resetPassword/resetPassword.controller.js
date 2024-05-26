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
  dateISO8601,
} from "../../router.js";
import ResetPassword from "./resetPassword.model.js";

export const validateResetPassword = validateBody(
  checkSchema,
  Users.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;
  const id = req.userId;
  req.userId = undefined;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  let { password } = req.body;

  // Set new password
  const newPassword = await hashPassword(password);
  password = undefined;
  req.body.password = undefined;
  req.body.passwordConfirmation = undefined;

  user.password = newPassword;
  user.passwordResetAt = dateISO8601(new Date(Date.now() - 1000));

  const rawJSON = JSON.stringify(user);

  await mssql()
    .request.input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(ResetPassword.update);

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

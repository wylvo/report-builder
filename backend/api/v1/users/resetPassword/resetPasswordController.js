import { checkSchema } from "express-validator";

import { User } from "../userModel.js";
import { filterUserData } from "../userController.js";
import {
  mssql,
  mssqlDataTypes,
  hashPassword,
  catchAsync,
  GlobalError,
} from "../../router.js";
import ResetPassword from "./resetPasswordModel.js";
import { validateBody } from "../../../../validation/validation.js";

export const validateResetPassword = validateBody(
  checkSchema,
  User.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;
  const id = req.userId;
  req.userId = undefined;

  const user = await User.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  let { password, passwordConfirmation } = req.body;

  // Set new password
  const newPassword = await hashPassword(password);
  password = undefined;
  passwordConfirmation = undefined;

  user.password = newPassword;
  user.passwordResetAt = Date.now() - 1000;

  const rawJSON = JSON.stringify(user);

  await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(ResetPassword.update);

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

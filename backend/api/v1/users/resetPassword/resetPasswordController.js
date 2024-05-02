import { checkSchema } from "express-validator";

import { User } from "../userModel.js";
import { filterUserData } from "../userController.js";
import { mssql, mssqlDataTypes } from "../../../../config/db.config.js";
import { hashPassword } from "../../../../auth/authController.js";
import { validateBody } from "../../../../validation/validation.js";
import GlobalError from "../../../../errors/globalError.js";
import catchAsync from "../../../../errors/catchAsync.js";
import resetUserPasswordSQL from "./resetPasswordModel.js";

export const validateResetPassword = validateBody(
  checkSchema,
  User.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;
  const id = req.userId;
  req.userId = undefined;

  const user = await User.findByUUID(id);

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
    .input("id", user.uuid)
    .input("rawJSON", NVarChar, rawJSON)
    .query(resetUserPasswordSQL.update);

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

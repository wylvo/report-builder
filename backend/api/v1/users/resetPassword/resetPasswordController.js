import { checkSchema } from "express-validator";

import { filterUserData } from "../userController.js";
import { User } from "../userModel.js";
import { mssql, mssqlDataTypes } from "../../../../config/db.config.js";
import { hashPassword } from "../../../../auth.js";
import GlobalError from "../../../errors/globalError.js";
import ValidationError, {
  errorValidationResult,
  formatErrors,
  isEmpty,
} from "../../../errors/validationError.js";
import catchAsync from "../../../errors/catchAsync.js";
import resetUserPasswordSQL from "./resetPasswordModel.js";

export const validateResetPassword = catchAsync(async (req, res, next) => {
  await checkSchema(User.schema.resetPassword(), ["body"]).run(req);
  const result = errorValidationResult(req);
  const errors = result.mapped();

  if (!isEmpty(errors)) {
    return next(new ValidationError(formatErrors(errors), errors, 400));
  }
  next();
});

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
    .query(resetUserPasswordSQL.update);

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

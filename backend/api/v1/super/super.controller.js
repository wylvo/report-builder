import bcrypt from "bcrypt";
import { checkSchema } from "express-validator";

import {
  validateBody,
  catchAsync,
  GlobalError,
  hashPassword,
} from "../router.js";
import { Super } from "./super.model.js";

export const validateResetSuperPassword = validateBody(
  checkSchema,
  Super.schema.resetSuperPassword
);

export const resetSuperPassword = catchAsync(async (req, res, next) => {
  delete req.body.newPasswordConfirmation;

  const password = await Super.getSuperPassword(req.user.id);

  // Check if the current password matches with the one in the database
  if (password && !(await bcrypt.compare(req.body.currentPassword, password)))
    return next(
      new GlobalError(
        "You do not have permission to perform this operation. Please contact your administrator.",
        403
      )
    );

  delete req.body.currentPassword;

  Super.resetSuperPassword(req.user.id, req.body.newPassword);

  delete req.body.newPassword;

  res.status(201).json({
    status: "success",
  });
});

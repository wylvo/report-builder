import { checkSchema } from "express-validator";

import { Users } from "../user.model.js";
import { filterUserData } from "../user.controller.js";
import { catchAsync, GlobalError, validateBody } from "../../router.js";

export const validateResetPassword = validateBody(
  checkSchema,
  Users.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const user = req.userFetched; // from validateUsername()

  delete req.body.passwordConfirmation;

  await Users.resetPassword(user.id, req.body.password);

  delete req.body.password;

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

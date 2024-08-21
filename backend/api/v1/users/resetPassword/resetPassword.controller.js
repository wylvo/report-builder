import { checkSchema } from "express-validator";

import { Users } from "../user.model.js";
import { filterUserData } from "../user.controller.js";
import { catchAsync, GlobalError, validateBody } from "../../router.js";

export const validateResetPassword = validateBody(
  checkSchema,
  Users.schema.resetPassword
);

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const id = req.userId;

  delete req.userId;
  delete req.body.passwordConfirmation;

  const user = await Users.findById(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await Users.resetPassword(user.id, req.body.password);

  delete req.body.password;

  res.status(201).json({
    status: "success",
    data: filterUserData(user),
  });
});

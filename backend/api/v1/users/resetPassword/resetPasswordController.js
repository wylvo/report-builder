import { filterObject, findUserByIdQuery } from "../userController.js";
import { mssql, mssqlDataTypes } from "../../../../config/db.config.js";
import { hashPassword } from "../../../../auth.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";
import resetUserPasswordSQL from "./resetPasswordModel.js";

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;
  const id = req.params.id;
  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  let { password, passwordConfirm } = req.body;

  if (password !== passwordConfirm)
    return next(new GlobalError("Passwords do not match.", 400));

  // Set new password
  const newPassword = await hashPassword(password);
  password = undefined;
  passwordConfirm = undefined;

  user.password = newPassword;
  user.passwordResetAt = Date.now() - 1000;

  const rawJSON = JSON.stringify(user);

  await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(resetUserPasswordSQL.update);

  res.status(201).json({
    status: "success",
    data: [
      filterObject(
        user,
        "id",
        "fullName",
        "username",
        "email",
        "initials",
        "role"
      ),
    ],
  });
});

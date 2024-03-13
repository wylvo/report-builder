import { filterObject, findUserByIdQuery } from "../userController.js";
import { mssqlRequest, mssqlDataTypes } from "../../../../config/db.config.js";
import { hashPassword } from "../../../../auth.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";
import resetUserPasswordSQL from "./resetPasswordQueries.js";

export const resetUserPassword = catchAsync(async (req, res, next) => {
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const { NVarChar } = mssqlDataTypes;
  const id = req.params.id;
  const user = await findUserByIdQuery(request1, id);

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

  await request2
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

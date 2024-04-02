import { resetUserPassword } from "./resetPassword/resetPasswordController.js";
import { hashPassword } from "../../../auth.js";
import { generateUUID } from "../router.js";
import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import catchAsync from "../../errors/catchAsync.js";
import GlobalError from "../../errors/globalError.js";
import usersSQL from "./userModel.js";

export const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const mergeUserData = (id, obj) => {
  return [
    {
      id,
      ...filterObject(
        obj,
        "role",
        "isEnabled",
        "email",
        "profilePictureURL",
        "fullName",
        "username",
        "initials"
      ),
    },
  ];
};

export const findUserByIdQuery = async (id) => {
  const {
    recordset: [user],
  } = await mssql().input("id", id).query(usersSQL.get);

  return user;
};

export const getUserId = (req, res, next) => {
  req.userId = req.params.id;
  next();
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { recordset: users } = await mssql().query(usersSQL.getAll);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const [
    {
      role,
      email,
      password,
      passwordConfirmation,
      profilePictureURL,
      fullName,
      username,
      initials,
    },
  ] = req.body;
  const id = generateUUID();

  if (!username || !email || !role || (!password && !passwordConfirmation))
    return next(
      new GlobalError(
        "Please provide role, email, username, and password.",
        400
      )
    );

  if (password !== passwordConfirmation)
    return next(new GlobalError("Passwords do not match.", 400));

  await mssql()
    .input("id", id)
    .input("role", role)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("profilePictureURL", profilePictureURL)
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials)
    .query(usersSQL.create);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user),
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await mssql()
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(usersSQL.update);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  await mssql().input("id", user.id).query(usersSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const enableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.isEnabled === true)
    return next(
      new GlobalError(`User is already enabled with id: ${id}.`, 400)
    );

  await mssql().input("id", user.id).query(usersSQL.enable);
  user.isEnabled = true;

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user),
  });
};

export const disableUser = async (req, res, next) => {
  const id = req.params.id;

  const user = await findUserByIdQuery(id);

  if (!user)
    return next(new GlobalError(`User not found with id: ${id}.`, 404));

  if (user.isEnabled === false)
    return next(
      new GlobalError(`User is already disabled with id: ${id}.`, 400)
    );

  await mssql().input("id", user.id).query(usersSQL.disable);
  user.isEnabled = false;

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user),
  });
};

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export { resetUserPassword as resetUserPassword };

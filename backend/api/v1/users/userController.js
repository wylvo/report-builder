import { signOut } from "./signOut/signOut.js";
import { hashPassword } from "../../../auth.js";
import { generateUUID } from "../router.js";
import { mssqlRequest, mssqlDataTypes } from "../../../config/db.config.js";
import catchAsync from "../../../errors/catchAsync.js";
import usersSQL from "./userQueries.js";

const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const mergeUserData = (id, obj) => {
  return [
    {
      id,
      ...filterObject(obj, "fullName", "username", "email", "initials", "role"),
    },
  ];
};

export const getAllUsers = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();

  const { recordset: users } = await request.query(usersSQL.getAll);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();

  const [{ fullName, username, initials, email, password, role }] = req.body;
  const id = generateUUID();

  await request
    .input("id", id)
    .input("fullName", fullName)
    .input("username", username)
    .input("initials", initials)
    .input("email", email)
    .input("password", await hashPassword(password))
    .input("role", role)
    .query(usersSQL.create);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();
  const id = req.params.id;

  let {
    recordset: [user],
  } = await request.input("id", id).query(usersSQL.get);

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: mergeUserData(id, user),
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const {
    recordset: [user],
  } = await request1.input("id", id).query(usersSQL.get);

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }
  console.log(user);

  await request2
    .input("id", user.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(usersSQL.update);

  res.status(201).json({
    status: "success",
    data: mergeUserData(id, ...req.body),
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const id = req.params.id;

  const {
    recordset: [user],
  } = await request1.input("id", id).query(usersSQL.get);

  if (!user) {
    res.status(404).json({
      status: "failed",
      message: "User not found.",
    });
    return;
  }

  await request2.input("id", user.id).query(usersSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { signOut as signOut };

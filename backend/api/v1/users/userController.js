import { readFile, writeFile } from "fs/promises";
import { signOut } from "./signOut/signOut.js";
import { hashPassword } from "../../../auth.js";

export const getAllUsers = async (req, res, next) => {
  res.status(200).json({
    route: "/getAllUsers",
  });
};

export const createUser = async (req, res, next) => {
  const user = {
    email: req.body.email,
    password: await hashPassword(req.body.password),
  };

  if (!user.email || !user.password) {
    res.status(400).json({
      status: "failed",
      message: "Unable to create user without email or password",
    });
  }

  const users = JSON.parse(
    await readFile("./backend/data/users.json", "utf-8")
  );

  users.push(user);

  await writeFile("./backend/data/users.json", JSON.stringify(users, null, 2));

  res.status(200).json({
    status: "success",
    message: "User created.",
    email: user.email,
  });
};

export const getUser = async (req, res, next) => {
  res.status(200).json({
    route: "/getUser",
  });
};

export const updateUser = async (req, res, next) => {
  res.status(200).json({
    route: "/updateUser",
  });
};

export const deleteUser = async (req, res, next) => {
  res.status(200).json({
    route: "/deleteUser",
  });
};

export { signOut as signOut };

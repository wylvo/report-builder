import { signOut } from "./signOut/signOut.js";

export const getAllUsers = async (req, res, next) => {
  res.status(200).json({
    route: "/getAllUsers",
  });
};

export const createUser = async (req, res, next) => {
  res.status(200).json({
    route: "/createUser",
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

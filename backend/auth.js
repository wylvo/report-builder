import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import config from "./config/app.config.js";
import bcrypt from "bcrypt";

export const comparePasswords = (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

export const signJWT = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const createJWT = (user, res, statusCode) => {
  const token = signJWT(user.password);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const proctect = async (req, res, next) => {
  // Check if has bearer in header value
  let bearer;
  if (req.headers?.authorization.startsWith("Bearer"))
    bearer = req.headers.authorization;

  if (!bearer) {
    res.status(401).json({
      message: "Unauthorized. Please sign in to get access.",
    });
    return;
  }

  // Check if has token in header value
  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401).json({
      message: "Invalid token. Please sign in to get access.",
    });
    return;
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // Check if user exists in DB
  // TO DO (query user unique id from DB)
  const currentUser = decoded.id;

  // Check if user changed password after the token was issued
  // TO DO (once DB is setup, and route to reset password)

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = decoded;
  next();
};

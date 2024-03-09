import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import config from "./config/app.config.js";
import bcrypt from "bcrypt";
import catchAsync from "./errors/catchAsync.js";

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
  const token = signJWT(user.id);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const protect = catchAsync(async (req, res, next) => {
  // Check if has bearer in header value
  let bearer;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    bearer = req.headers.authorization;

  if (!bearer) {
    res.status(401).json({
      status: "failed",
      message: "Unauthorized. Please sign in to get access.",
    });
    return;
  }

  // Check if has token in header value
  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401).json({
      status: "failed",
      message: "Invalid token. Please sign in to get access.",
    });
    return;
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // Check if user exists in DB
  const mssql = req.app.locals.mssql;
  const {
    recordset: [currentUser],
  } = await mssql.query(`SELECT * FROM users WHERE id = '${decoded.id}'`);

  if (!currentUser) {
    res.status(401).json({
      status: "failed",
      message: "Unable to verify the identity of the provided access token.",
    });
    return;
  }

  // Check if user changed password after the token was issued
  // TO DO (once route to reset password is setup)

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = decoded;
  next();
});

import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "./config/app.config.js";
import catchAsync from "./api/errors/catchAsync.js";
import GlobalError from "./api/errors/globalError.js";
import { mssql } from "./config/db.config.js";

export const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

const comparePasswords = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const hasResetPassword = function (user, JWTTimestamp) {
  if (user.passwordResetAt) {
    const changedTimestamp = parseInt(
      new Date(+user.passwordResetAt).getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

const signJWT = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const createJWT = (user, res, statusCode) => {
  const token = signJWT(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.cookie.expiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email & password exist
  if (!email || !password) {
    return next(
      new GlobalError(
        "Please sign in by providing both email and password.",
        400
      )
    );
  }

  // Check if user exists && password is correct
  const {
    recordset: [user],
  } = await mssql()
    .input("email", email)
    .query("SELECT * FROM users WHERE email = @email");

  if (!user || !(await comparePasswords(password, user.password)))
    return next(new GlobalError("Incorrect email or password", 401));

  // If everything is ok, send the token to client
  createJWT(user, res, 200);
});

export const protect = catchAsync(async (req, res, next) => {
  // Check if has bearer in header value
  let bearer;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    bearer = req.headers.authorization;

  if (!bearer) {
    return next(
      new GlobalError("Unauthorized. Please sign in to get access.", 401)
    );
  }

  // Check if has token in header value
  const [, token] = bearer.split(" ");

  if (!token) {
    return next(
      new GlobalError("Invalid token. Please sign in to get access.", 401)
    );
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // Check if user exists in DB

  const {
    recordset: [currentUser],
  } = await mssql()
    .input("id", decoded.id)
    .query("SELECT * FROM users WHERE id = @id");

  if (!currentUser) {
    return next(
      new GlobalError(
        "Unable to verify the identity of the provided access token. Please sign in to get access.",
        401
      )
    );
  }

  // Check if user changed password after the token was issued
  if (hasResetPassword(currentUser, decoded.iat)) {
    return next(
      new GlobalError(
        "User password was reset recently. Please sign in again.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new GlobalError(
          "You do not have permission to perform this operation.",
          403
        )
      );
    }

    next();
  };
};

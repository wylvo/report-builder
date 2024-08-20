import { promisify } from "util";
import { checkSchema } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import config from "../config/server.config.js";
import { Users } from "../api/v1/users/user.model.js";
import { validateBody } from "../validation/validation.js";
import catchAsync from "../errors/catchAsync.js";
import GlobalError from "../errors/globalError.js";
import { filterUserData } from "../api/v1/users/user.controller.js";

export const hashPassword = (password) => {
  return bcrypt.hash(password, 14);
};

const comparePasswords = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const hasResetPassword = function (user, JWTTimestamp) {
  if (user.passwordResetAt) {
    const d = new Date(user.passwordResetAt);
    const tz = 4;
    const changedTimestamp = parseInt(
      new Date(d.setHours(d.getHours() + tz)).getTime() / 1000,
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

  res.status(statusCode).json({
    status: "success",
    token,
    data: filterUserData(user),
  });
};

export const validateSignIn = validateBody(checkSchema, Users.schema.signIn);

export const signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await Users.findByEmail(email);

  // Check if user is active
  if (!user.active)
    return next(
      new GlobalError(
        "You account has been deactivated. Please contact your administrator.",
        401
      )
    );

  // Check if user exists && provided password is valid
  if (!user || !(await comparePasswords(password, user.password)))
    return next(new GlobalError("Incorrect email or password", 401));

  // If everything is ok, send the token to client
  createJWT(user, res, 200);
});

export const signOut = (req, res) => {
  res.cookie("jwt", "", {
    // maxAge: 1,
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check if token is in bearer header value or jwt cookie value
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const bearer = req.headers.authorization;
    [, token] = bearer.split(" ");
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new GlobalError("Unauthorized. Please sign in to get access.", 401)
    );
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // Check if user exists in DB
  const currentUser = await Users.findById(decoded.id);

  if (!currentUser) {
    return next(
      new GlobalError(
        "Unable to verify the identity of the provided access token. Please sign in to get access.",
        401
      )
    );
  }

  // Check if user is active
  if (!currentUser.active)
    return next(
      new GlobalError(
        "You account has been deactivated. Please contact your administrator.",
        401
      )
    );

  // Check if user changed password after the token was issued
  if (hasResetPassword(currentUser, decoded.iat)) {
    return next(
      new GlobalError("User password was reset. Please sign in again.", 401)
    );
  }

  // Clear sensitive data
  delete currentUser.password;
  delete currentUser.passwordResetAt;
  delete currentUser.failedAuthenticationAttempts;

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
export const isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        config.jwt.secret
      );

      // Check if user still exists
      const currentUser = await Users.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // Check if user changed password after the token was issued
      if (hasResetPassword(currentUser, decoded.iat)) {
        return next();
      }

      // Clear sensitive data
      delete currentUser.password;
      delete currentUser.passwordResetAt;
      delete currentUser.failedAuthenticationAttempts;

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(req.user.role, roles);
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

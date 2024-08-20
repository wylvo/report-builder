// https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-tds/9805e9fa-1f8b-4cf8-8f78-8d2602228635?redirectedfrom=MSDN
// https://learn.microsoft.com/en-us/sql/relational-databases/errors-events/database-engine-events-and-errors?view=sql-server-ver16

import GlobalError from "./globalError.js";

const handleDuplicateFieldsDB = (error) => {
  let value = error.originalError.info.message;
  if (
    value.startsWith(
      "Violation of UNIQUE KEY constraint 'UQ__users__AB6E616412575E78'. Cannot insert duplicate key in object 'dbo.users'. "
    )
  )
    value = value.slice(117);
  return new GlobalError(`${value} Please use another value.`, 400);
};

const handleJWTError = () =>
  new GlobalError("Invalid access token. Please sign in again.", 401);

const handleTokenExpiredError = () =>
  new GlobalError("Your access token has expired. Please sign in again.", 401);

const handlePayloadTooLargeError = () =>
  new GlobalError("Your request payload is too large.", 413);

const sendErrorDev = (err, req, res) => {
  // console.error("ERROR 💥", err);

  // API error
  if (
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/auth/signin")
  ) {
    // Trusted error: send message to client
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Render error to frontend
  return res.status(err.statusCode).render("error", {
    title: "Error",
    statusCode: err.statusCode,
    scriptPath: null,
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // console.error("ERROR 💥", err);

  // API error
  if (
    req.originalUrl.startsWith("/api") ||
    req.originalUrl.startsWith("/auth/signin")
  ) {
    // Trusted error: send message to client
    if (err.isTrusted) {
      if (typeof err.trustedMessage === "object") {
        err.trustedMessage = Object.values(err.trustedMessage)
          .map((message) => message)
          .join(" ");
      }
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message || err.trustedMessage,
      });
    }

    // Programming or other unknown error: don't leak error details
    // Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  // Render error to frontend
  // Trusted error: send message to client
  if (err.isTrusted) {
    // console.error(err);
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      statusCode: err.statusCode,
      scriptPath: null,
      msg: err.message || err.trustedMessage,
    });
  }

  // Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    statusCode: err.statusCode,
    scriptPath: null,
    msg: "Please try again later.",
  });
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.number === 2627) error = handleDuplicateFieldsDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    if (err.name === "PayloadTooLargeError")
      error = handlePayloadTooLargeError();
    sendErrorProd(error, req, res);
  }
};

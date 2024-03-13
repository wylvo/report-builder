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
  new GlobalError("Invalid token. Please log in again!", 401);

const handleTokenExpiredError = () =>
  new GlobalError("Your token has expired please log in again.", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isTrusted) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message || err.trustedMessage,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // Log Error
    console.error("ERROR 💥", err);

    // Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.number === 2627) error = handleDuplicateFieldsDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    sendErrorProd(error, res);
  }
};

// https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-tds/9805e9fa-1f8b-4cf8-8f78-8d2602228635?redirectedfrom=MSDN

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
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
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
  // console.log(err.stack);
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    // if (err.name === "CastError") error = handleCastErrorDB(error);
    // if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    // if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    // if (err.name === "JsonWebTokenError") error = handleJWTError();
    // if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    sendErrorProd(error, res);
  }
};

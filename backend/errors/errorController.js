export default (err, req, res, next) => {
  // console.log(err.stack);
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    // sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // let error = { ...err };
    // if (err.name === "CastError") error = handleCastErrorDB(error);
    // if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    // if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    // if (err.name === "JsonWebTokenError") error = handleJWTError();
    // if (err.name === "TokenExpiredError") error = handleTokenExpiredError();
    // sendErrorProd(error, res);
  }
};

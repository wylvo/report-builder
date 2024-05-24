import { validationResult } from "express-validator";

export const errorValidationResult = validationResult.withDefaults({
  formatter: (error) =>
    error.path ? `${error.path}: ${error.msg}` : error.msg,
});

export const formatErrors = (objectOrArray) => {
  let message = "";
  Object.keys(objectOrArray).forEach(
    (field) => (message += `${objectOrArray[field]} `)
  );
  return message.slice(0, -1);
};

export const isEmpty = (obj) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
};

class ValidationError extends Error {
  constructor(message, validationErrors, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failed" : "error";
    this.isTrusted = true;
    this.trustedMessage = validationErrors;

    Error.captureStackTrace(this, this.contructor);
  }
}

export default ValidationError;

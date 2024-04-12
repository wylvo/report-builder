import { validationResult } from "express-validator";

export const errorValidationResult = validationResult.withDefaults({
  formatter: (error) => error.msg,
});

export const formatErrors = (obj) => {
  let message = "";
  Object.keys(obj).forEach((field) => (message += `${obj[field]} `));
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

import { validationResult } from "express-validator";

export const errorValidationResult = validationResult.withDefaults({
  formatter: (error) => {
    if (error.path) {
      // Regular expression to match '[i]' or '[i].' pattern
      // Where 'i' is a number and the position of an array element
      const regex = /\[(\d+)\](\.)?/;

      // Check if the error.path string value contains the pattern
      if (regex.test(error.path)) {
        // Replace the pattern '[i]' or '[i].' with 'Report i'
        error.path = error.path.replace(
          regex,
          (match, p1, p2) => `Report ${Number(p1) + 1}${Number(p2) + 1 || ""} `
        );
      }
      return `${error.path}: ${error.msg}`;
    }

    return error.msg;
  },
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

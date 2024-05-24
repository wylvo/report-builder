import { checkExact } from "express-validator";

import catchAsync from "../errors/catchAsync.js";
import ValidationError, {
  errorValidationResult,
  isEmpty,
  formatErrors,
} from "../errors/validationError.js";

// prettier-ignore
export const validateBody = (checkSchema, schemaToApply, errorType = "mapped") =>
  catchAsync(async (req, res, next) => {
    await checkExact(checkSchema(schemaToApply, ["body"]), {
      message: fields => {
        const [field] = fields;
        return `Unknown field '${field.path}' in request ${field.location} with value '${field.value}'`;
      },
    }).run(req);
    const result = errorValidationResult(req);
    const errors = errorType !== "mapped" ? result.array() : result.mapped();

    if (!isEmpty(errors))
      return next(new ValidationError(formatErrors(errors), errors, 400));
    next();
  });

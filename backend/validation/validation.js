import catchAsync from "../errors/catchAsync.js";
import ValidationError, {
  errorValidationResult,
  isEmpty,
  formatErrors,
} from "../errors/validationError.js";

export const validateBody = (
  checkSchema,
  schemaToApply,
  errorType = "mapped"
) =>
  catchAsync(async (req, res, next) => {
    await checkSchema(schemaToApply, ["body"]).run(req);
    const result = errorValidationResult(req);
    const errors = errorType !== "mapped" ? result.array() : result.mapped();

    if (!isEmpty(errors))
      return next(new ValidationError(formatErrors(errors), errors, 400));
    next();
  });

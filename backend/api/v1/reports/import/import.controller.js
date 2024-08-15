import { ExpressValidator } from "express-validator";

import {
  Reports,
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
  isUsername,
} from "../report.model.js";

const { checkSchema } = new ExpressValidator({
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
});

import {
  mssql,
  config,
  validateBody,
  catchAsync,
  GlobalError,
} from "../../router.js";

// prettier-ignore
export const validateBodyIsArray = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body))
    return next(new GlobalError("Request body has to be an array enclosed by []", 400));
  if (req.body.length === 0)
    return next(new GlobalError("Request body array can't be empty", 400));
  const importLimit = config.request.import.reportCountLimit
  if (req.body.length > importLimit)
    return next(
      new GlobalError(`Request body array has too many report objects. You can only import up to ${importLimit} reports. Your request had ${req.body.length} reports.`, 400)
    );
  next();
});

export const validateImport = validateBody(
  checkSchema,
  Reports.validation.import,
  false
);

// Custom validation to check if createdAt and updatedAt have proper time constraints
// prettier-ignore
export const validateTimestampsAndTransactionObject = catchAsync(async (req, res, next) => {
  const reports = req.body;

  reports.forEach((report, i) => {
    const pos = i + 1;
    const createdAt = new Date(report.createdAt);
    const updatedAt = new Date(report.updatedAt);

    if (createdAt > Date.now())
      return next(new GlobalError(`Report ${pos} createdAt: can't be greater than the current time.`, 400));
    
    if (updatedAt > Date.now())
      return next(new GlobalError(`Report ${pos} updatedAt: can't be greater than the current time.`, 400));

    if (createdAt > new Date(report.updatedAt))
      return next(new GlobalError(`Report ${pos} createdAt: can't be greater than updatedAt.`, 400));

    if (report.incident.transaction.types) {
      if (typeof report.incident.transaction.number === "undefined")
        report.incident.transaction.number = null;
      // if (typeof report.incident.hasVarianceReport === "undefined")
      //   report.incident.hasVarianceReport = false;
    }
  });

  next();
});

// Custom validation to check if all the usernames are not empty
// prettier-ignore
export const validateUsernamesAndFilterDuplicates = catchAsync(async (req, res, next) => {
  let raiseError;
  const reports = req.body;
  
  // Get all unique usernames from the request body
  const uniqueUsernames = Array.from(
    new Set(
      reports
        .map((report) => [report.createdBy, report.updatedBy, report.assignedTo])
        .flat()
    )
  );

  const validUsernames = new Map();

  for (const username of uniqueUsernames) {
    const user = await isUsername(username, raiseError = false);
    if (!user)
      return next(new GlobalError(`Username '${username}' does not exist.`, 400));

    validUsernames.set(user.username, user.id);
  }

  // Modify createdBy, updatedBy, assignedTo values to their respective user ids
  reports.forEach((report) => {
    report.createdBy = validUsernames.get(report.createdBy);
    report.updatedBy = validUsernames.get(report.updatedBy);
    report.assignedTo = validUsernames.get(report.assignedTo);

    // Keep only unique values for each arrays inside a report
    report.store.numbers = [...new Set(report.store.numbers)];
    report.incident.types = [...new Set(report.incident.types)];
    report.incident.transaction.types = [...new Set(report.incident.transaction.types)];
  });
  
  next();
});

export const importReports = catchAsync(async (req, res, next) => {
  const startTime = Date.now();
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const reports = await Reports.import(req.body, transaction);
    await transaction.commit();

    const elapsedTime = (Date.now() - startTime) / 1000;
    cliLogger.info(`IMPORT in: ${elapsedTime}s`);

    res.status(201).json({
      status: "success",
      results: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    throw error;
  }
});

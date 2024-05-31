import { ExpressValidator } from "express-validator";

import {
  Reports,
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
} from "../report.model.js";

const { checkSchema } = new ExpressValidator({
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
});

import {
  mssql,
  mssqlDataTypes,
  dateISO8601,
  config,
  validateBody,
  catchAsync,
  GlobalError,
  dateMSSharePoint,
} from "../../router.js";

export const validateImport = validateBody(
  checkSchema,
  Reports.validation.import,
  false
);

// Custom validation to check if all the usernames are not empty
export const validateUsernames = catchAsync((req, res, next) => {
  const uniqueUsernames = new Set([
    ...new Set(req.body.map((report) => report.createdBy)),
    ...new Set(req.body.map((report) => report.updatedBy)),
    ...new Set(req.body.map((report) => report.assignedTo)),
  ]);

  console.log(uniqueUsernames);
  // req.body.forEach((report) => {});
  next();
});

export const importReports = catchAsync(async (req, res, next) => {
  // const transaction = mssql().transaction;

  try {
    // await transaction.begin();
    // const report = await Reports.import(
    //   req.body,
    //   req.user.username,
    //   transaction
    // );
    // await transaction.commit();

    res.status(201).json({
      status: "success",
      data: "report",
    });
  } catch (error) {
    // await transaction.rollback();
    return next(
      new GlobalError(
        `An error occured while creating a report: ${error.message}.`,
        401
      )
    );
  }
});

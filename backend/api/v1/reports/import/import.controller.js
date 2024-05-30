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

export const importReports = catchAsync(async (req, res, next) => {
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const report = await Reports.import(
      req.body,
      req.user.username,
      transaction
    );
    await transaction.commit();

    res.status(201).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    await transaction.rollback();
    return next(
      new GlobalError(
        `An error occured while creating a report: ${error.message}.`,
        401
      )
    );
  }
});

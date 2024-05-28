import { Reports } from "../report.model.js";

import {
  mssql,
  mssqlDataTypes,
  dateISO8601,
  config,
  generateUUID,
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
      data: filterReportData(report),
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

import { ExpressValidator } from "express-validator";
import bcrypt from "bcrypt";

import {
  Report,
  isNotEmptyArray,
  isNewReport,
  isDateTime,
  isTimeCustom,
  isValidUsername,
} from "./reportModel.js";
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
} from "../router.js";

const { checkSchema } = new ExpressValidator({
  isNotEmptyArray,
  isNewReport,
  isDateTime,
  isTimeCustom,
  isValidUsername,
});

export const getAllReports = catchAsync(async (req, res, next) => {
  const { results, data } = await Report.all();

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const getAllSoftDeletedReports = catchAsync(async (req, res, next) => {
  const softDeleted = true;
  const { results, data } = await Report.all(softDeleted);

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Report.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  console.time("TOTAL CREATE");
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const report = await Report.create(
      req.body,
      req.user.id,
      req.assignedTo,
      transaction
    );
    await transaction.commit();

    console.timeEnd("TOTAL CREATE");
    // console.log(report);

    res.status(201).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const getReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const validateUpdate = validateBody(checkSchema, Report.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  console.time("Update");
  const transaction = mssql().transaction;

  try {
    const reportUpdated = await Report.update(
      req.body,
      report,
      req.user.username
    );

    await transaction.commit();
    // console.log(reportUpdated);
    console.timeEnd("Update");
    res.status(201).json({
      status: "success",
      data: reportUpdated,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const validateHardDelete = validateBody(
  checkSchema,
  Report.schema.hardDelete
);

export const deleteReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  // If regular user, ONLY soft delete allowed
  if (req.user.role === "User") await Report.softDelete(report);

  // If admin, BOTH soft & hard delete allowed
  if (req.user.role === "Admin" && req.body.isHardDelete === true) {
    const password = await Report.superPassword();

    // For additional security, require for a password
    if (!(await bcrypt.compare(req.body.password, password)))
      return next(
        new GlobalError(
          "You do not have permission to perform this operation.",
          403
        )
      );

    await Report.hardDelete(report);
  } else await Report.softDelete(report);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const undoSoftDeleteReport = async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  if (report.isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  const reportUpdated = await Report.undoSoftDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

export const validateImport = validateBody(checkSchema, Report.schema.import);

export const importReport = catchAsync(async (req, res, next) => {
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const report = await Report.import(
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

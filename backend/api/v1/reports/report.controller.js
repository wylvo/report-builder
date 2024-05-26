import { ExpressValidator } from "express-validator";
import bcrypt from "bcrypt";

import {
  Reports,
  isNotEmptyArray,
  isNewReport,
  isDateTime,
  isTimeCustom,
  isValidUsername,
} from "./report.model.js";
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
  const { results, data } = await Reports.all();

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const getAllSoftDeletedReports = catchAsync(async (req, res, next) => {
  const softDeleted = true;
  const { results, data } = await Reports.all(softDeleted);

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Reports.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  console.time("CREATE");
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const report = await Reports.create(
      req.body,
      req.user.id,
      req.assignedTo,
      transaction
    );
    await transaction.commit();

    console.timeEnd("CREATE");
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

  const report = await Reports.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const validateUpdate = validateBody(checkSchema, Reports.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Reports.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  console.time("UPDATE");
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const reportUpdated = await Reports.update(
      req.body,
      report,
      req.user.username
    );

    await transaction.commit();

    console.timeEnd("UPDATE");
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
  Reports.schema.hardDelete
);

export const deleteReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  console.log(uuid);
  const report = await Reports.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  // EXTRA check if user is not an admin return an error
  if (req.user.role !== "Admin")
    return next(
      new GlobalError(
        "You do not have permission to perform this operation.",
        403
      )
    );

  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const password = await Reports.superPassword(req.user.id, transaction);

    // For additional security, require for a password
    if (!(await bcrypt.compare(req.body.password, password)))
      return next(
        new GlobalError(
          "You do not have permission to perform this operation. Please contact your administrator.",
          403
        )
      );

    await Reports.hardDelete(report, transaction);
    await transaction.commit();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const softDeleteReport = async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Reports.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  if (report.isDeleted === true)
    return next(
      new GlobalError(
        `Report is already marked as deleted with id: ${uuid}.`,
        400
      )
    );

  const reportUpdated = await Reports.softDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

export const undoSoftDeleteReport = async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Reports.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  if (report.isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${uuid}.`, 400)
    );

  const reportUpdated = await Reports.undoSoftDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

export const validateImport = validateBody(checkSchema, Reports.schema.import);

export const importReport = catchAsync(async (req, res, next) => {
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

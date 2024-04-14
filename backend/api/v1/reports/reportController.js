import { ExpressValidator } from "express-validator";

import { Report, isDateTime } from "./reportModel.js";
import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";
import ValidationError, {
  errorValidationResult,
  formatErrors,
  isEmpty,
} from "../../../errors/validationError.js";

const { checkSchema } = new ExpressValidator({ isDateTime });

export const getAllReports = catchAsync(async (req, res, next) => {
  const {
    recordset: [reports],
  } = await mssql().query(Report.query.all());

  const { results, data } = !reports
    ? { results: 0, data: [] }
    : { results: reports.length, data: reports };

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = catchAsync(async (req, res, next) => {
  await checkSchema(Report.schema.create, ["body"]).run(req);
  const result = errorValidationResult(req);
  const errors = result.mapped();

  if (!isEmpty(errors))
    return next(new ValidationError(formatErrors(errors), errors, 400));
  next();
});

export const createReport = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const id = req.body.id;
  // const username = req.user.username;
  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [report],
  } = await mssql()
    .input("id", id)
    // .input("username", username)
    .input("rawJSON", NVarChar, rawJSON)
    .query(Report.query.insert());

  res.status(201).json({
    status: "success",
    data: report,
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await Report.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const updateReport = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const report = await Report.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  await mssql()
    .input("id", report[0].id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(Report.query.update());

  res.status(201).json({
    status: "success",
    data: req.body,
  });
});

const hardDeleteReport = async (report) => {
  await mssql().input("id", report[0].id).query(Report.query.delete);
};

const softDeleteReport = async (report) => {
  await mssql().input("id", report[0].id).query(Report.query.softDelete);
};

export const undoSoftDeleteReport = async (req, res, next) => {
  const id = req.params.id;

  const report = await Report.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report[0].isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  await mssql().input("id", report[0].id).query(Report.query.undoSoftDelete);
  report[0].isDeleted = false;

  res.status(200).json({
    status: "success",
    data: report,
  });
};

export const deleteReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await Report.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (req.user.role === "user") softDeleteReport(report);
  if (req.user.role === "admin")
    req.body.isHardDelete ? hardDeleteReport(report) : softDeleteReport(report);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const getSoftDeletedReports = catchAsync(async (req, res, next) => {
  const {
    recordset: [reports],
  } = await mssql().query(Report.query.allSoftDeleted());

  const { results, data } = !reports
    ? { results: 0, data: [] }
    : { results: reports.length, data: reports };

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

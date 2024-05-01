import { ExpressValidator } from "express-validator";
import bcrypt from "bcrypt";

import { Report, isDateTime, isTimeCustom } from "./reportModel.js";
import { mssql, mssqlDataTypes } from "../router.js";
import { validateBody } from "../../../validation/validation.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";

const { checkSchema } = new ExpressValidator({ isDateTime, isTimeCustom });

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

export const getAllSoftDeletedReports = catchAsync(async (req, res, next) => {
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

export const validateCreate = validateBody(checkSchema, Report.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  const { NVarChar, Int } = mssqlDataTypes;

  const id = req.body.id;
  // const username = req.user.username;
  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [[report]],
  } = await mssql()
    .input("id", Int, id)
    .input("uuid", uuid)
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

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const validateUpdate = validateBody(checkSchema, Report.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const id = req.body.id;

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  const { NVarChar } = mssqlDataTypes;
  // const username = req.user.username;
  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [[reportUpdated]],
  } = await mssql()
    .input("id", report.id)
    // .input("username", username)
    .input("rawJSON", NVarChar, rawJSON)
    .query(Report.query.update());

  res.status(201).json({
    status: "success",
    data: reportUpdated,
  });
});

export const validateHardDelete = validateBody(
  checkSchema,
  Report.schema.hardDelete
);

const hardDeleteReport = async (report) => {
  await mssql().input("id", report.id).query(Report.query.delete);
};

const softDeleteReport = async (report) => {
  await mssql().input("id", report.id).query(Report.query.softDelete);
};

export const deleteReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  // If regular user, ONLY soft delete allowed
  if (req.user.role === "user") softDeleteReport(report);

  // If admin, BOTH soft & hard delete allowed
  if (req.user.role === "admin" && req.body.isHardDelete) {
    const password = await Report.superPassword();

    // For additional security, require for a password
    if (!(await bcrypt.compare(req.body.password, password)))
      return next(
        new GlobalError(
          "You do not have permission to perform this operation.",
          403
        )
      );

    hardDeleteReport(report);
  } else softDeleteReport(report);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const undoSoftDeleteReport = async (req, res, next) => {
  const id = req.params.id;

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report.isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  const {
    recordset: [[reportUpdated]],
  } = await mssql().input("id", report.id).query(Report.query.undoSoftDelete());

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

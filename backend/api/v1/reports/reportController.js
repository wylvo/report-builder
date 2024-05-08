import { ExpressValidator } from "express-validator";
import bcrypt from "bcrypt";

import {
  Report,
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
} from "../router.js";
import { validateBody } from "../../../validation/validation.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";

const { checkSchema } = new ExpressValidator({
  isNewReport,
  isDateTime,
  isTimeCustom,
  isValidUsername,
});

const filterReportData = (data) =>
  Object.keys(data)
    .filter((key) => !["id"].includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

const filterReportArrayData = (data) => {
  const reports = [];
  if (data && Array.isArray(data))
    data.forEach((obj) => reports.push(filterReportData(obj)));
  return reports;
};

export const getAllReports = catchAsync(async (req, res, next) => {
  const {
    recordset: [reports],
  } = await mssql().query(Report.query.all());

  const { results, data } = !reports
    ? { results: 0, data: [] }
    : { results: reports.length, data: filterReportArrayData(reports) };

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
    : { results: reports.length, data: filterReportArrayData(reports) };

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Report.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  req.body.uuid = generateUUID();
  req.body.version = config.version;
  req.body.createdAt = dateISO8601(new Date());
  req.body.updatedAt = dateISO8601(new Date());
  req.body.createdBy = req.user.username;
  req.body.updatedBy = req.user.username;

  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  console.log(body);

  const {
    recordset: [[report]],
  } = await mssql()
    .input("rawJSON", NVarChar, rawJSON)
    .input("uuid", req.body.uuid)
    .query(Report.query.insert());

  res.status(201).json({
    status: "success",
    data: filterReportData(report),
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: filterReportData(report),
  });
});

export const validateUpdate = validateBody(checkSchema, Report.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const id = req.body.uuid;

  const [report] = await Report.findByUUID(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  const { NVarChar } = mssqlDataTypes;

  req.body.version = config.version;
  req.body.createdAt = report.createdAt;
  req.body.updatedAt = dateISO8601(new Date());
  req.body.createdBy = report.createdBy;
  req.body.updatedBy = req.user.username;

  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [[reportUpdated]],
  } = await mssql()
    .input("id", report.id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(Report.query.update());

  console.log(reportUpdated);
  res.status(201).json({
    status: "success",
    data: filterReportData(reportUpdated),
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
    data: filterReportData(reportUpdated),
  });
};

export const validateImport = validateBody(checkSchema, Report.schema.import);

export const importReport = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  req.body.version = config.version;
  req.body.createdBy = req.user.username;
  req.body.updatedBy = req.user.username;

  const body = [req.body];
  const rawJSON = JSON.stringify(body);

  const {
    recordset: [[report]],
  } = await mssql()
    .input("rawJSON", NVarChar, rawJSON)
    .input("uuid", uuid)
    .query(Report.query.insert());

  res.status(201).json({
    status: "success",
    data: filterReportData(report),
  });
});

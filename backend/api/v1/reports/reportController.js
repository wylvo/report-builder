import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import GlobalError from "../../errors/globalError.js";
import catchAsync from "../../errors/catchAsync.js";
import reportsSQL from "./reportModel.js";

export const findReportByIdQuery = async (id) => {
  const {
    recordset: [report],
  } = await mssql().input("id", id).query(reportsSQL.get);

  return report;
};

export const getAllReports = catchAsync(async (req, res, next) => {
  const {
    recordset: [reports],
  } = await mssql().query(reportsSQL.getAll);

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: reports,
  });
});

export const createReport = catchAsync(async (req, res, next) => {
  const { NVarChar } = mssqlDataTypes;

  const rawJSON = JSON.stringify(req.body);

  await mssql().input("rawJSON", NVarChar, rawJSON).query(reportsSQL.create);

  res.status(201).json({
    status: "success",
    data: req.body,
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await findReportByIdQuery(id);

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

  const report = await findReportByIdQuery(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  await mssql()
    .input("id", report[0].id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(reportsSQL.update);

  res.status(201).json({
    status: "success",
    data: req.body,
  });
});

const hardDeleteReport = async (report) => {
  await mssql().input("id", report[0].id).query(reportsSQL.delete);
};

const softDeleteReport = async (report) => {
  await mssql().input("id", report[0].id).query(reportsSQL.softDelete);
};

export const undoSoftDeleteReport = async (req, res, next) => {
  const id = req.params.id;

  const report = await findReportByIdQuery(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report[0].isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  await mssql().input("id", report[0].id).query(reportsSQL.undoSoftDelete);
  report[0].isDeleted = false;

  res.status(200).json({
    status: "success",
    data: report,
  });
};

export const deleteReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await findReportByIdQuery(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (req.user.role === "user") softDeleteReport(report);
  if (req.user.role === "admin")
    req.body.isSoftDelete ? softDeleteReport(report) : hardDeleteReport(report);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

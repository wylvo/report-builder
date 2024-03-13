import { mssql, mssqlDataTypes } from "../../../config/db.config.js";
import GlobalError from "../../errors/globalError.js";
import catchAsync from "../../errors/catchAsync.js";
import reportsSQL from "./reportQueries.js";

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

export const deleteReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await findReportByIdQuery(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  await mssql().input("id", report[0].id).query(reportsSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

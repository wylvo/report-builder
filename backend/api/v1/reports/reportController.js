import catchAsync from "../../../errors/catchAsync.js";
import {
  getAllReportsQuery,
  createReportQuery,
  getReportQuery,
  updateReportQuery,
  deleteReportQuery,
} from "./reportQueries.js";

export const getAllReports = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;

  const {
    recordset: [reports],
  } = await mssql.query(getAllReportsQuery);

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: reports,
  });
});

export const createReport = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const { NVarChar } = req.app.locals.mssqlDataTypes;

  const rawJSON = JSON.stringify(req.body);

  let {
    output: { report },
  } = await mssql
    .request()
    .input("rawJSON", NVarChar, rawJSON)
    .output("report", NVarChar, rawJSON)
    .query(createReportQuery);

  [report] = JSON.parse(report);

  res.status(201).json({
    status: "success",
    message: "Report created.",
    report,
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [report],
  } = await mssql.request().input("id", id).query(getReportQuery);

  if (!report) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const updateReport = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const { NVarChar } = req.app.locals.mssqlDataTypes;
  const id = req.params.id;

  const {
    recordset: [hasReport],
  } = await mssql.request().input("id", id).query(getReportQuery);

  if (!hasReport) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }
  const rawJSON = JSON.stringify(req.body);

  let {
    output: { report },
  } = await mssql
    .request()
    .input("id", hasReport[0].id)
    .input("rawJSON", NVarChar, rawJSON)
    .output("report", NVarChar, rawJSON)
    .query(updateReportQuery);

  [report] = JSON.parse(report);

  res.status(201).json({
    status: "success",
    message: "Report updated.",
    report,
  });
});

export const deleteReport = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;
  const id = req.params.id;

  const {
    recordset: [report],
  } = await mssql.request().input("id", id).query(getReportQuery);

  if (!report) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }
  await mssql.request().input("id", report[0].id).query(deleteReportQuery);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

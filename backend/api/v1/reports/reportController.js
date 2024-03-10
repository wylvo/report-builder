import catchAsync from "../../../errors/catchAsync.js";
import reportsSQL from "./reportQueries.js";

export const getAllReports = catchAsync(async (req, res, next) => {
  const mssql = req.app.locals.mssql;

  const {
    recordset: [reports],
  } = await mssql.query(reportsSQL.getAll);

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
    .query(reportsSQL.create);

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
  } = await mssql.request().input("id", id).query(reportsSQL.get);

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
  } = await mssql.request().input("id", id).query(reportsSQL.get);

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
    .query(reportsSQL.update);

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
  } = await mssql.request().input("id", id).query(reportsSQL.get);

  if (!report) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }
  await mssql.request().input("id", report[0].id).query(reportsSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

import { mssqlRequest, mssqlDataTypes } from "../../../config/db.config.js";
import GlobalError from "../../../errors/globalError.js";
import catchAsync from "../../../errors/catchAsync.js";
import reportsSQL from "./reportQueries.js";

export const findReportByIdQuery = async (request, id) => {
  const {
    recordset: [report],
  } = await request.input("id", id).query(reportsSQL.get);

  return report;
};

export const getAllReports = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();

  const {
    recordset: [reports],
  } = await request.query(reportsSQL.getAll);

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: reports,
  });
});

export const createReport = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();
  const { NVarChar } = mssqlDataTypes;

  const rawJSON = JSON.stringify(req.body);

  await request.input("rawJSON", NVarChar, rawJSON).query(reportsSQL.create);

  res.status(201).json({
    status: "success",
    data: req.body,
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();
  const id = req.params.id;

  const report = await findReportByIdQuery(request, id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const updateReport = catchAsync(async (req, res, next) => {
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const report = await findReportByIdQuery(request1, id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  await request2
    .input("id", report[0].id)
    .input("rawJSON", NVarChar, rawJSON)
    .query(reportsSQL.update);

  res.status(201).json({
    status: "success",
    data: req.body,
  });
});

export const deleteReport = catchAsync(async (req, res, next) => {
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const id = req.params.id;

  const report = await findReportByIdQuery(request1, id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  await request2.input("id", report[0].id).query(reportsSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

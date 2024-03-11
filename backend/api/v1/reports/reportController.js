import { mssqlRequest, mssqlDataTypes } from "../../../config/db.config.js";
import catchAsync from "../../../errors/catchAsync.js";
import reportsSQL from "./reportQueries.js";

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

  const {
    recordset: [report],
  } = await request.input("id", id).query(reportsSQL.get);

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
  const request1 = mssqlRequest();
  const request2 = mssqlRequest();
  const { NVarChar } = mssqlDataTypes;

  const id = req.params.id;
  const rawJSON = JSON.stringify(req.body);

  const {
    recordset: [report],
  } = await request1.input("id", id).query(reportsSQL.get);

  if (!report) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }

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

  const {
    recordset: [report],
  } = await request1.input("id", id).query(reportsSQL.get);

  if (!report) {
    res.status(404).json({
      status: "failed",
      message: "Report not found.",
    });
    return;
  }

  await request2.input("id", report[0].id).query(reportsSQL.delete);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

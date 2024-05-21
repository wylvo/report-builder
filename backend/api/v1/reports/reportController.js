import { ExpressValidator } from "express-validator";
import bcrypt from "bcrypt";

import {
  Report,
  isNotEmptyArray,
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
  const { results, data } = await Report.all();

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const getAllSoftDeletedReports = catchAsync(async (req, res, next) => {
  const softDeleted = true;
  const { results, data } = await Report.all(softDeleted);

  res.status(200).json({
    status: "success",
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Report.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  const report = await Report.create(
    req.body,
    req.user.id,
    req.user.id,
    req.assignedTo
  );

  res.status(201).json({
    status: "success",
    data: report,
  });
});

export const getReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const validateUpdate = validateBody(checkSchema, Report.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  const reportUpdated = await Report.update(
    req.body,
    report,
    req.user.username
  );

  console.log(reportUpdated);
  res.status(201).json({
    status: "success",
    data: reportUpdated,
  });
});

export const validateHardDelete = validateBody(
  checkSchema,
  Report.schema.hardDelete
);

export const deleteReport = catchAsync(async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  // If regular user, ONLY soft delete allowed
  if (req.user.role === "User") await Report.softDelete(report);

  // If admin, BOTH soft & hard delete allowed
  if (req.user.role === "Admin" && req.body.isHardDelete === true) {
    const password = await Report.superPassword();

    // For additional security, require for a password
    if (!(await bcrypt.compare(req.body.password, password)))
      return next(
        new GlobalError(
          "You do not have permission to perform this operation.",
          403
        )
      );

    await Report.hardDelete(report);
  } else await Report.softDelete(report);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const undoSoftDeleteReport = async (req, res, next) => {
  const uuid = req.params.id;

  const report = await Report.findByUUID(uuid);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${uuid}.`, 404));

  if (report.isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  const reportUpdated = await Report.undoSoftDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
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

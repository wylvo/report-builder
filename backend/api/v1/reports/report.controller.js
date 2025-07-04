import bcrypt from "bcrypt";
import { ExpressValidator } from "express-validator";

import {
  Reports,
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
} from "./report.model.js";

import {
  mssql,
  validateBody,
  catchAsync,
  GlobalError,
  cliLogger,
} from "../router.js";
import { Users } from "../users/user.model.js";
import { Super } from "../super/super.model.js";

const { checkSchema } = new ExpressValidator({
  isNotEmptyArray,
  isDateTime,
  isTimeCustom,
  isValidUsername,
});

export const getAllReports = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { total, results, data } = await Reports.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const getAllSoftDeletedReports = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const softDeleted = true;
  const { total, results, data } = await Reports.all(page, rows, softDeleted);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Reports.schema.create);

export const createReport = catchAsync(async (req, res, next) => {
  const startTime = Date.now();
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const report = await Reports.create(
      req.body,
      req.user.id,
      req.assignedTo,
      transaction
    );
    await transaction.commit();

    const elapsedTime = (Date.now() - startTime) / 1000;
    cliLogger.info(`CREATE in: ${elapsedTime}s`);

    res.status(201).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const getReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await Reports.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

export const validateUpdate = validateBody(checkSchema, Reports.schema.update);

export const updateReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  if (Number(id) !== req.body.id)
    return next(
      new GlobalError(
        `Request body id value does match with the request parameter id value.`,
        400
      )
    );

  const report = await Reports.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report.isDeleted)
    return next(
      new GlobalError(
        `Report is deleted, recover the report with id: ${id} first and try again.`,
        400
      )
    );

  if (req.user.role === "User" && req.user.username !== report.createdBy)
    return next(
      new GlobalError(
        `This report belongs to ${report.createdBy}. You are not allowed to make changes on this report.`,
        403
      )
    );

  const startTime = Date.now();
  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const reportUpdated = await Reports.update(
      req.body,
      report,
      req.user.username
    );

    await transaction.commit();

    const elapsedTime = (Date.now() - startTime) / 1000;
    cliLogger.info(`CREATE in: ${elapsedTime}s`);

    res.status(201).json({
      status: "success",
      data: reportUpdated,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const validateHardDelete = validateBody(
  checkSchema,
  Reports.schema.hardDelete
);

export const deleteReport = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const report = await Reports.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  // EXTRA check if user is not an admin return an error
  if (req.user.role !== "Admin")
    return next(
      new GlobalError(
        "You do not have permission to perform this operation.",
        403
      )
    );

  const transaction = mssql().transaction;

  try {
    await transaction.begin();
    const password = await Super.getSuperPassword(req.user.id, transaction);

    // For additional security, require for a password
    if (password && !(await bcrypt.compare(req.body.password, password)))
      return next(
        new GlobalError(
          "You do not have permission to perform this operation. Please contact your administrator.",
          403
        )
      );

    await Reports.hardDelete(report, transaction);
    await transaction.commit();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const softDeleteReport = async (req, res, next) => {
  const id = req.params.id;

  const report = await Reports.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report.isDeleted === true)
    return next(
      new GlobalError(
        `Report is already marked as deleted with id: ${id}.`,
        400
      )
    );

  if (req.user.role === "User" && req.user.username !== report.createdBy)
    return next(
      new GlobalError(
        `This report belongs to ${report.createdBy}. You are not allowed to make changes on this report.`,
        403
      )
    );

  const reportUpdated = await Reports.softDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

export const undoSoftDeleteReport = async (req, res, next) => {
  const id = req.params.id;

  const report = await Reports.findById(id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  if (report.isDeleted === false)
    return next(
      new GlobalError(`Report is not marked as deleted with id: ${id}.`, 400)
    );

  if (req.user.role === "User" && req.user.username !== report.createdBy)
    return next(
      new GlobalError(
        `This report belongs to ${report.createdBy}. You are not allowed to make changes on this report.`,
        403
      )
    );

  const reportUpdated = await Reports.undoSoftDelete(report);

  res.status(200).json({
    status: "success",
    data: reportUpdated,
  });
};

export const getAllReportsCreatedByUser = catchAsync(async (req, res, next) => {
  const username = req.params.username;

  const user = await Users.findByUsername(username);

  if (!user)
    return next(
      new GlobalError(`User not found with username: ${username}.`, 404)
    );

  const { page, rows } = req.query;
  const { total, results, data } = await Reports.createdBy(user.id, page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const getAllSoftDeletedReportsCreatedByUser = catchAsync(
  async (req, res, next) => {
    const username = req.params.username;

    const user = await Users.findByUsername(username);

    if (!user)
      return next(
        new GlobalError(`User not found with username: ${username}.`, 404)
      );

    const { page, rows } = req.query;
    const softDeleted = true;
    const { total, results, data } = await Reports.createdBy(
      user.id,
      page,
      rows,
      softDeleted
    );

    res.status(200).json({
      status: "success",
      total,
      results,
      data,
    });
  }
);

export const transferReportOwnershipToUser = catchAsync(
  async (req, res, next) => {
    const { id, username } = req.params;

    const [report, user] = await Promise.all([
      Reports.findById(id),
      Users.findByUsername(username),
    ]);

    if (!report)
      return next(new GlobalError(`Report not found with id: ${id}.`, 404));

    if (!user)
      return next(
        new GlobalError(`User not found with username: ${username}.`, 404)
      );

    if (req.user.role === "User" && req.user.username !== report.createdBy)
      return next(
        new GlobalError(
          `This report belongs to ${report.createdBy}. You are not allowed to make changes on this report.`,
          403
        )
      );

    if (req.user.username === user.username)
      return next(
        new GlobalError(
          `You can't transfer reports you own to yourself. This report already belongs to you.`,
          400
        )
      );

    const reportUpdated = await Reports.transferReportOwnershipTo(
      user.id,
      req.user.id,
      report
    );

    res.status(200).json({
      status: "success",
      data: reportUpdated,
    });
  }
);

export { migrateReport } from "./migrate/migrate.controller.js";
export {
  validateBodyIsArray,
  validateImport,
  validateTimestampsAndTransactionObject,
  validateUsernamesAndFilterDuplicates,
  importReports,
} from "./import/import.controller.js";

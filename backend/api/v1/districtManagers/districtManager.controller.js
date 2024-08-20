import bcrypt from "bcrypt";
import { checkSchema } from "express-validator";

import { validateBody, catchAsync, GlobalError } from "../router.js";
import { DistrictManagers } from "./districtManager.model.js";
import { Super } from "../super/super.model.js";

export const getAllDistrictManagers = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { total, results, data } = await DistrictManagers.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const validateCreate = validateBody(
  checkSchema,
  DistrictManagers.validation.create
);

export const createDistrictManager = catchAsync(async (req, res, next) => {
  const districtManager = await DistrictManagers.create(req.body);

  res.status(201).json({
    status: "success",
    data: districtManager,
  });
});

export const getDistrictManager = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const districtManager = await DistrictManagers.findById(id);

  if (!districtManager)
    return next(
      new GlobalError(`District manager not found with id: ${id}.`, 404)
    );

  res.status(200).json({
    status: "success",
    data: districtManager,
  });
});

export const validateUpdate = validateBody(
  checkSchema,
  DistrictManagers.validation.update
);

export const updateDistrictManager = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  if (Number(id) !== req.body.id)
    return next(
      new GlobalError(
        `Request body id value does match with the request parameter id value.`,
        400
      )
    );

  const districtManager = await DistrictManagers.findById(id);

  if (!districtManager)
    return next(
      new GlobalError(`District manager not found with id: ${id}.`, 404)
    );

  const districtManagerUpdated = await DistrictManagers.update(
    req.body,
    districtManager
  );

  res.status(201).json({
    status: "success",
    data: districtManagerUpdated,
  });
});

export const validateHardDelete = validateBody(
  checkSchema,
  DistrictManagers.validation.hardDelete
);

export const deleteDistrictManager = catchAsync(async (req, res, next) => {
  // EXTRA check if user is not an admin return an error
  if (req.user.role !== "Admin")
    return next(
      new GlobalError(
        "You do not have permission to perform this operation.",
        403
      )
    );

  const id = req.params.id;

  const districtManager = await DistrictManagers.findById(id);

  if (!districtManager)
    return next(
      new GlobalError(`District manager not found with id: ${id}.`, 404)
    );

  if (districtManager.storeNumbers && districtManager.storeNumbers.length > 0)
    return next(
      new GlobalError(
        `Unable to delete district manager with id: ${id}. Found ${districtManager.storeNumbers.length} stores assigned to this district manager.`,
        401
      )
    );

  const password = await Super.getSuperPassword(req.user.id);

  // For additional security, require for a password
  if (!(await bcrypt.compare(req.body.password, password)))
    return next(
      new GlobalError(
        "You do not have permission to perform this operation. Please contact your administrator.",
        403
      )
    );

  await DistrictManagers.hardDelete(districtManager);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

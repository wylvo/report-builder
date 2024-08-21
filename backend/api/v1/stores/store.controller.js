import { ExpressValidator } from "express-validator";

import { validateBody, catchAsync, GlobalError } from "../router.js";
import { Stores, isValidDistrictManagerUsername } from "./store.model.js";

const { checkSchema } = new ExpressValidator({
  isValidDistrictManagerUsername,
});

export const getAllStores = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { total, results, data } = await Stores.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const validateCreate = validateBody(checkSchema, Stores.schema.create);

export const createStore = catchAsync(async (req, res, next) => {
  const store = await Stores.create(req.body, req.districtManagerId);

  res.status(201).json({
    status: "success",
    data: store,
  });
});

export const getStore = catchAsync(async (req, res, next) => {
  const number = req.params.number;

  const store = await Stores.findByNumber(number);

  if (!store)
    return next(
      new GlobalError(`Store not found with number: ${number}.`, 404)
    );

  res.status(200).json({
    status: "success",
    data: store,
  });
});

export const validateUpdate = validateBody(checkSchema, Stores.schema.update);

export const updateStore = catchAsync(async (req, res, next) => {
  const number = req.params.number;

  const store = await Stores.findByNumber(number);

  if (!store)
    return next(
      new GlobalError(`Store not found with number: ${number}.`, 404)
    );

  const storeUpdated = await Stores.update(
    req.body,
    store,
    req.districtManagerId
  );

  res.status(201).json({
    status: "success",
    data: storeUpdated,
  });
});

export const deleteStore = catchAsync(async (req, res, next) => {
  // EXTRA check if user is not an admin return an error
  if (req.user.role !== "Admin")
    return next(
      new GlobalError(
        "You do not have permission to perform this operation.",
        403
      )
    );

  const number = req.params.number;

  const store = await Stores.findByNumber(number);

  if (!store)
    return next(
      new GlobalError(`Store not found with number: ${number}.`, 404)
    );

  if (store.reports > 0)
    return next(
      new GlobalError(
        `Unable to delete store number: ${number}. Found ${store.reports} reports related to this store.`,
        400
      )
    );

  await Stores.hardDelete(store);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

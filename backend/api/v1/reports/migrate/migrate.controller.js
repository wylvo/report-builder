import { Reports } from "../report.model.js";
import {
  mssql,
  mssqlDataTypes,
  config,
  validateBody,
  catchAsync,
  GlobalError,
  dateMSSharePoint,
} from "../../router.js";

export const migrateReport = catchAsync(async (req, res, next) => {
  const version = req.params.version;
  console.log(version);
  // const reports = null;

  res.status(201).json({
    status: "success",
    data: version,
  });
});

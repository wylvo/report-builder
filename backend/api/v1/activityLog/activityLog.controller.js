import { catchAsync, GlobalError } from "../router.js";
import { ActivityLog } from "./activityLog.model.js";

export const getAllActivityLogs = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const { total, results, data } = await ActivityLog.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

export const getAllActivityLogsFrontend = catchAsync(async (req, res, next) => {
  const { page, rows } = req.query;
  const frontend = true;
  const { total, results, data } = await ActivityLog.all(page, rows, frontend);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

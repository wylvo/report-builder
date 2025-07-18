import { Stats } from "./stats.model.js";

import { mssql, catchAsync, GlobalError } from "../router.js";

export const getAllStats = catchAsync(async (req, res, next) => {
  const [stats] = await Stats.all();

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

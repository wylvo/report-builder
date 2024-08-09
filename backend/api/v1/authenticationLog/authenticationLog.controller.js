import { catchAsync, GlobalError } from "../router.js";
import { AuthenticationLog } from "./authenticationLog.model.js";

export const getAllAuthenticationLogs = catchAsync(async (req, res, next) => {
  console.log(req.user);

  const { page, rows } = req.query;
  const { total, results, data } = await AuthenticationLog.all(page, rows);

  res.status(200).json({
    status: "success",
    total,
    results,
    data,
  });
});

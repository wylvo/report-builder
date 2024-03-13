import { mssqlRequest } from "../../../config/db.config.js";
import { findReportByIdQuery } from "../reports/reportController.js";
import catchAsync from "../../errors/catchAsync.js";
import GlobalError from "../../errors/globalError.js";
import { setAdaptiveCard } from "./card.js";

// Send AJAX Request To Microsoft Teams Webhook URL Endpoint With (Adaptive) Card JSON In Body
const send = async (card) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  };

  return await fetch(process.env.MS_TEAMS_WEBHOOK_URL, requestOptions);
};

export const sendReportToWebhook = catchAsync(async (req, res, next) => {
  const request = mssqlRequest();
  const id = req.params.id;

  const report = await findReportByIdQuery(request, id);

  if (!report)
    return next(new GlobalError(`Report not found with id: ${id}.`, 404));

  // const response = await send(setAdaptiveCard(...report));

  res.status(200).json({
    status: "success",
    data: report,
  });
});

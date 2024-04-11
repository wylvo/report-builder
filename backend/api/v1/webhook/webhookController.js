import { mssql } from "../../../config/db.config.js";
import { Report } from "../reports/reportModel.js";
import { setAdaptiveCard } from "./card.js";
import catchAsync from "../../errors/catchAsync.js";
import GlobalError from "../../errors/globalError.js";
import config from "../../../config/app.config.js";

// Send AJAX Request To Microsoft Teams Webhook URL Endpoint With (Adaptive) Card JSON In Body
const send = async (card) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  };

  return await fetch(config.webhook.microsoftTeams.url, requestOptions);
};

export const sendReportToIncomingWebhook = catchAsync(
  async (req, res, next) => {
    const id = req.params.id;

    const report = await Report.findById(id);

    if (!report)
      return next(new GlobalError(`Report not found with id: ${id}.`, 404));

    // const response = await send(setAdaptiveCard(...report));

    res.status(200).json({
      status: "success",
      data: report,
    });
  }
);

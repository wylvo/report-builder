import { Reports } from "../reports/report.model.js";
import { config, mssql, catchAsync, GlobalError } from "../router.js";
import { Webhooks } from "./webhook.model.js";

// prettier-ignore
export const sendReportToIncomingWebhook = catchAsync(
  async (req, res, next) => {
    const id = req.params.id;

    const report = await Reports.findById(id);

    if (!report)
      return next(new GlobalError(`Report not found with id: ${id}.`, 404));

    const sentAt = new Date().toISOString();
    
    const [reportUpdatedHasTriggeredWebhook, response] = await Promise.all([
      Webhooks.updateHasTriggeredWebhook(report, req.user.username, false),
      Webhooks.microsoftTeams.send(report),
    ]);

    const receivedAt = new Date().toISOString();

    let reportUpdatedIsWebhookSent;
    if (response.ok)
      reportUpdatedIsWebhookSent = await Webhooks.updateIsWebhookSent(report, req.user.username, false);

    res.status(200).json({
      status: "success",
      webhook: {
        service: "microsoftTeams",
        sentAt: sentAt,
        receivedAt: receivedAt,
        response: {
          statusCode: response.status,
          statusText: response.statusText,
          body: response.body,
        },
      },
      data: reportUpdatedIsWebhookSent
      ? reportUpdatedIsWebhookSent
      : reportUpdatedHasTriggeredWebhook,
    });
  }
);

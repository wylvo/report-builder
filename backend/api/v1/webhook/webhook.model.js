import { config, mssql, mssqlDataTypes } from "../router.js";
import microsoftTeamsAdpativeCard from "./microsoftTeamsAdpativeCard.js";

const { NVARCHAR, VARCHAR, BIT, INT } = mssqlDataTypes;

// Check if object is empty
const isEmptyObject = (object) => {
  for (const property in object) {
    if (Object.hasOwn(object, property)) {
      return false;
    }
  }
  return true;
};

export const Webhooks = {
  // UPDATE 'hasTriggeredWebhook' REPORT BY ID
  async updateHasTriggeredWebhook(report, updatedBy, hasTriggeredWebhook) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("reportId", INT, report.id)
      .input("updatedBy", VARCHAR, updatedBy)
      .input("hasTriggeredWebhook", BIT, hasTriggeredWebhook)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_update_hasTriggeredWebhook");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  // UPDATE 'isWebhookSent' REPORT BY ID
  async updateIsWebhookSent(report, updatedBy, isWebhookSent) {
    const {
      output: { report: rawJSON },
    } = await mssql()
      .request.input("reportId", INT, report.id)
      .input("updatedBy", VARCHAR, updatedBy)
      .input("isWebhookSent", BIT, isWebhookSent)
      .output("report", NVARCHAR)
      .execute("api_v1_reports_update_isWebhookSent");

    const reportUpdated = JSON.parse(rawJSON);

    return reportUpdated;
  },

  microsoftTeams: {
    // Send AJAX Request To Microsoft Teams Webhook URL Endpoint With (Adaptive) Card JSON In Body
    async send(report) {
      const adaptiveCard = this.setAdaptiveCard(report);

      // console.log(JSON.stringify(adaptiveCard.attachments[0].content, null, 2));

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adaptiveCard),
      };

      return await fetch(config.webhook.microsoftTeams.url, requestOptions);
    },

    // Parse Report Data Into Readable Variables. Return Report Data & Adaptive Card As JSON
    setAdaptiveCard(report) {
      // Meta Data
      const id = report.id;
      const createdTime = report.createdAt.split(".")[0] + "Z";
      const username = report.assignedTo;
      const user = config.validation.selects.users.find(
        (user) => user.username === username
      );

      // TODO
      const techProfilePicture = () => "null";
      const appVersion = `v${config.version}`;

      // Call
      const callDate = new Date(report.call.date).toDateString();
      const callTime = report.call.dateTime.split(" ").slice(1, 3).join(" ");
      const callStatus = report.call.status;
      const callStatusColor = () => {
        if (report.call.status.includes("In Progress")) return "Warning";
        if (report.call.status.includes("Completed")) return "Good";
        return "Accent";
      };
      const callPhone = report.call.phone;
      const isOnCall = report.isOnCall;
      const isProcedural = report.incident.isProcedural;
      const isProceduralText = report.incident.isProcedural ? "Yes" : "No";

      // Store Information
      const storeNumbers = report.store.numbers.join(", ");
      const storeEmployeeName = report.store.employee.name;
      const isStoreEmployeeManager = report.store.employee.isStoreManager
        ? "Yes"
        : "No";
      const storeDMFullNames = report.store.districtManagers
        .map((dM) => dM.fullName)
        .join(", ");

      // Incident Details
      const incidentTitle = report.incident.title;
      const incidentTypes = report.incident.types.join(", ");
      const incidentPos = report.incident.pos;
      const incidentErrorCode = report.incident.error;

      // Incident Transaction Details
      const incidentTransaction = isEmptyObject(report.incident.transaction)
        ? report.incident.transaction
        : {
            types: report.incident.transaction.types.join(", "),
            number: report.incident.transaction.number,
            hasVarianceReport: report.incident.transaction.hasVarianceReport
              ? "Yes"
              : "No",
          };

      const incidentDetails = report.incident.details;

      return microsoftTeamsAdpativeCard(
        id,
        report,
        incidentTitle,
        techProfilePicture,
        user.fullName,
        createdTime,
        callStatusColor,
        isOnCall,
        isProcedural,
        callDate,
        callStatus,
        callTime,
        callPhone,
        storeNumbers,
        storeEmployeeName,
        storeDMFullNames,
        isStoreEmployeeManager,
        incidentTypes,
        incidentErrorCode,
        incidentPos,
        isProceduralText,
        incidentTransaction,
        isEmptyObject,
        incidentDetails,
        appVersion
      );
    },
  },
};

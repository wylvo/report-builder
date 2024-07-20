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
      const createdAt =
        new Date(report.createdAt).toISOString().split(".")[0] + "Z";
      const username = report.assignedTo;
      const user = config.validation.selects.users.find(
        (user) => user.username === username
      );
      if (
        user.profilePictureURI &&
        user.profilePictureURI === "/img/default_profile_picture.jpg"
      )
        user.profilePictureURI = this.DEFAULT_PROFILE_PICTURE;

      // Version
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
      const incidentHasVarianceReport = report.incident.hasVarianceReport
        ? "Yes"
        : "No";

      // Incident Transaction Details
      const incidentTransaction = isEmptyObject(report.incident.transaction)
        ? report.incident.transaction
        : {
            types: report.incident.transaction.types.join(", "),
            number: report.incident.transaction.number,
          };

      const incidentDetails = report.incident.details;

      return microsoftTeamsAdpativeCard(
        id,
        report,
        incidentTitle,
        user.profilePictureURI,
        user.fullName,
        createdAt,
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
        incidentHasVarianceReport,
        isProceduralText,
        incidentTransaction,
        isEmptyObject,
        incidentDetails,
        appVersion
      );
    },

    DEFAULT_PROFILE_PICTURE:
      "data:image/png;base64,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",
  },
};

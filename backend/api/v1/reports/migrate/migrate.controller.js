import { catchAsync, GlobalError } from "../../router.js";

export const migrateReport = catchAsync(async (req, res, next) => {
  const reports = req.body;

  const nameToUsername = (name) =>
    name.toLowerCase().includes("evora")
      ? (name = "william.evora")
      : name.toLowerCase().includes("nikitaras")
      ? (name = "vasileios.nikitaras")
      : name.toLowerCase().includes("lariccia")
      ? (name = "anthony.lariccia")
      : name.toLowerCase().includes("tam")
      ? (name = "robert.tam")
      : name.toLowerCase().includes("malcolm")
      ? (name = "carah.malcolm")
      : null;

  reports.forEach((report, i) => {
    delete report.id;
    delete report.version;

    const cDT = report.createdDateTime;
    const lMDT = report.lastModifiedDateTime || report.lastModified;
    report.createdAt = cDT ? cDT : report.createdAt;
    if (lMDT && !report.updatedAt) report.updatedAt = lMDT;
    if (!lMDT && !report.updatedAt) report.updatedAt = report.createdAt;

    delete report.createdDateTime;
    delete report.lastModifiedDateTime;
    delete report.lastModified;

    report.createdBy = nameToUsername(report.createdBy);
    report.updatedBy = report.updatedBy
      ? nameToUsername(report.updatedBy)
      : report.createdBy;

    if (report.tech?.username) report.assignedTo = report.tech.username;
    if (typeof report.tech?.isOnCall !== "undefined")
      report.isOnCall = report.tech.isOnCall;

    delete report.call.dateTime;

    const sN = report.store.number;
    if (sN) {
      report.store.numbers = [sN];
      delete report.store.number;
    }

    delete report.store.districtManager;

    delete report.incident.date;
    delete report.incident.time;
    delete report.incident.dateTime;
    delete report.incident.copyTimestamp;

    const iT = report.incident.type;
    if (iT) {
      report.incident.types = [iT];
      delete report.incident.type;
    }

    if (report.incident.transaction.type) {
      const iTT = report.incident.transaction.type;
      report.incident.transaction.types = [iTT];
      delete report.incident.transaction.type;
    }

    const details = report.incident.details;
    if (details !== "") {
      const detailsArray = details.toLowerCase().split(" ");
      const hasAudioInIncidentDetails = ["mib", "audio", "music"].some((word) =>
        detailsArray.includes(word)
      );
      if (hasAudioInIncidentDetails) {
        if (!report.incident.types.includes("Audio"))
          report.incident.types.push("Audio");
      }
    }
    if (details === "") report.incident.details = "None";

    const isIRCreated = report.incident.transaction.isIRCreated;
    if (typeof isIRCreated !== "undefined") {
      report.incident.transaction.hasVarianceReport = isIRCreated;
      delete report.incident.transaction.isIRCreated;
    }

    delete report.tech;
  });

  res.status(200).json({
    status: "success",
    data: reports,
  });
});

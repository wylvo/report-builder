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
    report.createdAt = cDT;
    report.updatedAt = lMDT ? lMDT : report.createdAt;
    delete report.createdDateTime;
    delete report.lastModifiedDateTime;
    delete report.lastModified;

    report.createdBy = nameToUsername(report.createdBy);
    report.updatedBy = report.updatedBy
      ? nameToUsername(report.updatedBy)
      : report.createdBy;

    report.assignedTo = report.tech.username;
    report.isOnCall = report.tech.isOnCall;

    delete report.call.dateTime;

    const sN = report.store.number;
    report.store.numbers = [sN];
    delete report.store.number;

    delete report.store.districtManager;

    delete report.incident.date;
    delete report.incident.time;
    delete report.incident.dateTime;
    delete report.incident.copyTimestamp;

    const iT = report.incident.type;
    report.incident.types = [iT];
    delete report.incident.type;

    if (report.incident.transaction.type) {
      const iTT = report.incident.transaction.type;
      report.incident.transaction.types = [iTT];
      delete report.incident.transaction.type;
    }

    const isIRCreated = report.incident.transaction.isIRCreated;
    report.incident.transaction.hasVarianceReport = isIRCreated;
    delete report.incident.transaction.isIRCreated;

    delete report.tech;
    if (i === 155) console.log(report);
    // delete report.tableRowEl;
  });

  res.status(201).json({
    status: "success",
    data: reports,
  });
});

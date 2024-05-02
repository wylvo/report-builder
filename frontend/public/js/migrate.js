// Verify if all the reports have been migrated
const reportMigration = (reports) => {
  const reportsToMigrate = new Map();
  reports.forEach((report) => {
    if (report?.version === "0.1.1-beta")
      reportsToMigrate.set(report.id, report);
    if (report?.version === "1.0.0-beta")
      reportsToMigrate.set(report.id, report);
  });

  return {
    isUnmigrated: reportsToMigrate.size > 0 ? true : false,
    reportsToMigrate,
  };
};

// Migrate Report Data To Current Version
export const migrateReportData = (reports) => {
  try {
    let hasToMigrate = false;
    const migration = reportMigration(reports);
    if (migration.isUnmigrated) {
      hasToMigrate = true;
      migration.reportsToMigrate.forEach((report) => {
        report.version = "1.0.0-beta";
        report.call.status = "Completed";
        report.isWebhookSent = false;
        report.hasTriggeredWebhook = false;

        if (report.createdTime) {
          const cT = report.createdTime;
          report.createdDateTime = cT;
          delete report.createdTime;
        }

        if (report.lastModified) {
          const lM = report.lastModified;
          report.lastModifiedDateTime = lM;
          delete report.lastModified;
        }

        if (typeof report.isReadOnly !== "undefined") {
          delete report.isReadOnly;
        }

        if (report.formEl) {
          delete report.formEl;
        }

        if (report.listItemEl) {
          const lIE = report.listItemEl;
          report.tableRowEl = lIE;
          delete report.listItemEl;
        }

        if (report.techName || report.techUsername || report.isOnCall) {
          report.tech = {
            name: report.techName,
            username: report.techUsername,
            initials:
              report.techUsername.toUpperCase().split(".")[0][0] +
              report.techUsername.toUpperCase().split(".")[1][0],
            isOnCall: report.isOnCall,
          };

          delete report.techName;
          delete report.techUsername;
          delete report.isOnCall;
        }
      });
    }
    return hasToMigrate;
  } catch (error) {
    throw error;
  }
};

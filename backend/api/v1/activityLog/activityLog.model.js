import { mssql, mssqlDataTypes, config } from "../router.js";

const { VARCHAR, NVARCHAR, INT } = mssqlDataTypes;

export const ActivityLog = {
  // GET ALL ACTIVITY LOGS
  async all(pageNumber = 1, rowsPerPage = 200, frontend = false) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 200 ? (rowsPerPage = 200) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { activityLog, count },
    } = await mssql()
      .request.output("activityLog", NVARCHAR)
      .output("count", INT)
      .input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .execute(
        frontend
          ? "api_v1_activityLog_getAllFrontend"
          : "api_v1_activityLog_getAll"
      );

    const activityLogs = JSON.parse(activityLog);

    return !activityLogs
      ? { total: 0, results: 0, data: [] }
      : {
          total: count,
          results: activityLogs.length,
          data: activityLogs,
        };
  },

  // CREATE A NEW ACTIVITY LOG ENTRY
  async create(body) {
    return await mssql()
      .request.input("userId", INT, body.userId)
      .input("method", VARCHAR, body.method)
      .input("url", NVARCHAR, body.url)
      .input("statusCode", INT, body.statusCode)
      .execute("api_v1_activityLog_create");
  },
};

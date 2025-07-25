import { mssql, mssqlDataTypes, config } from "../router.js";

const { VARCHAR, NVARCHAR, INT } = mssqlDataTypes;

export const ActivityLog = {
  // GET ALL ACTIVITY LOGS
  async all(pageNumber = 1, rowsPerPage = 500, frontend = false) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 500 ? (rowsPerPage = 500) : rowsPerPage;
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
  create(req, res) {
    const userUsername = req.user.username;
    const userRole = req.user.role;
    const method = req.method;
    const url = `${req.baseUrl}${req.url}`;
    const statusCode = res.statusCode;

    return mssql()
      .request.input("username", VARCHAR, userUsername)
      .input("role", VARCHAR, userRole)
      .input("method", VARCHAR, method)
      .input("url", NVARCHAR, url)
      .input("statusCode", INT, statusCode)
      .execute("api_v1_activityLog_create");
  },
};

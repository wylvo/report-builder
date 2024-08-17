import { mssql, mssqlDataTypes, config } from "../router.js";

const { VARCHAR, NVARCHAR, INT, BIT } = mssqlDataTypes;

export const AuthenticationLog = {
  // GET ALL AUTHENTICATION LOGS
  async all(pageNumber = 1, rowsPerPage = 500) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 500 ? (rowsPerPage = 500) : rowsPerPage;
    pageNumber = pageNumber <= 0 ? (pageNumber = 1) : pageNumber;

    const {
      output: { authenticationLog, count },
    } = await mssql()
      .request.output("authenticationLog", NVARCHAR)
      .output("count", INT)
      .input("pageNumber", INT, pageNumber)
      .input("rowsPerPage", INT, rowsPerPage)
      .execute("api_v1_authenticationLog_getAll");

    const authenticationLogs = JSON.parse(authenticationLog);

    return !authenticationLogs
      ? { total: 0, results: 0, data: [] }
      : {
          total: count,
          results: authenticationLogs.length,
          data: authenticationLogs,
        };
  },

  // CREATE A NEW AUTHENTICATION LOG ENTRY
  create(req, isSuccessful) {
    const email = req.body.email;
    const clientIp =
      req?.headers["x-forwarded-for"] ?? req?.socket.remoteAddress;
    const userAgent = req?.headers["user-agent"];

    return mssql()
      .request.input("email", VARCHAR, email)
      .input("clientIp", VARCHAR, clientIp)
      .input("userAgent", NVARCHAR, userAgent)
      .input("isSuccessful", BIT, isSuccessful)
      .execute("api_v1_authenticationLog_create");
  },
};

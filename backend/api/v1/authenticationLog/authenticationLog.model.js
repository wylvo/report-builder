import { mssql, mssqlDataTypes, config } from "../router.js";

const { VARCHAR, NVARCHAR, INT, BIT } = mssqlDataTypes;

export const AuthenticationLog = {
  // GET ALL AUTHENTICATION LOGS
  async all(pageNumber = 1, rowsPerPage = 200) {
    rowsPerPage =
      rowsPerPage <= 0 || rowsPerPage > 200 ? (rowsPerPage = 200) : rowsPerPage;
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
  async create(body) {
    return await mssql()
      .request.input("email", VARCHAR, body.email)
      .input("remoteIp", VARCHAR, body.remoteIp)
      .input("userAgent", NVARCHAR, body.userAgent)
      .input("isSuccessful", BIT, body.isSuccessful)
      .execute("api_v1_authenticatonLog_create");
  },
};

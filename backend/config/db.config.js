import sql from "mssql/msnodesqlv8.js";
import catchAsync from "../api/errors/catchAsync.js";
import GlobalError from "../api/errors/globalError.js";

const dbConfig = {
  driver: "msnodesqlv8",
  server:
    process.env.DB_PORT !== "" && process.env.DB_SERVER.includes("\\")
      ? process.env.DB_SERVER + `,${process.env.DB_PORT}`
      : process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  trustServerCertificate: true,
  parseJSON: true,
  options: {
    // encrypt: true, // for Azure SQL
    trustedConnection: false, // use windows authentication
  },
  beforeConnect: function (bcConfig) {
    // Modify the connection options here
    /** The Driver SQL Server Native Client has been removed from SQL Server 2022.
     *  Source https://learn.microsoft.com/en-us/sql/relational-databases/native-client/applications/installing-sql-server-native-client?view=sql-server-ver16
     *  ODBC Driver 17 for SQL Server is tested working well with SQL Server 2019 & 2022 */
    bcConfig.conn_str = bcConfig.conn_str.replace(
      "SQL Server Native Client 11.0",
      "ODBC Driver 17 for SQL Server"
    );
  },
};

if (process.env.DB_AUTH_TYPE.toUpperCase() === "WINDOWS")
  dbConfig.options.trustedConnection = true;

export const connectToDB = catchAsync(async () => {
  const pool = await new sql.ConnectionPool(dbConfig).connect();
  if (pool.connected) {
    console.log("MS SQL Server connection successful!");
    mssqlPool.push(pool);
  }
});

export const mssqlPool = [];

export const mssql = () => {
  if (mssqlPool.length === 0)
    new GlobalError(
      "No connection pool found. Please make sure DB connection has established.",
      500
    );

  const [pool] = mssqlPool;

  return new sql.Request(pool);
};

export const mssqlDataTypes = {
  NVarChar: sql.NVarChar,
  Int: sql.Int,
  Bit: sql.Bit,
  DateTime: sql.DateTime,
};

export default dbConfig;

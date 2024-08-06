import sql from "mssql/msnodesqlv8.js";

import GlobalError from "../errors/globalError.js";
import { cliLogger } from "../logs/logger.js";

const dbServer =
  process.env.DB_PORT !== "" && process.env.DB_SERVER.includes("\\")
    ? `${process.env.DB_SERVER},${process.env.DB_PORT}`
    : process.env.DB_SERVER;
const dbName = process.env.DB_NAME;
const dbPort = process.env.DB_PORT !== "" ? process.env.DB_PORT : undefined;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

export const dbConfig = {
  connection: {
    driver: "msnodesqlv8",
    server: dbServer,
    database: dbName,
    port: dbPort,
    user: dbUsername,
    password: dbPassword,
    trustServerCertificate: true,
    parseJSON: true,
    options: {
      // encrypt: true, // for Azure SQL
      trustedConnection: false, // use Windows authentication
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 60000,
    },
    beforeConnect: function (bcConfig) {
      // Modify the connection options here
      // The Driver SQL Server Native Client has been removed from SQL Server 2022.
      // Source: https://learn.microsoft.com/en-us/sql/relational-databases/native-client/applications/installing-sql-server-native-client?view=sql-server-ver16
      // ODBC Driver 17 for SQL Server is tested working well with SQL Server 2019 & 2022
      bcConfig.conn_str = bcConfig.conn_str.replace(
        "SQL Server Native Client 11.0",
        process.env.ODBC_DRIVER
      );
    },
  },

  async connectToDB() {
    const pool = await new sql.ConnectionPool(this.connection).connect();
    if (pool.connected) {
      mssqlPool.push(pool);
      cliLogger.info("MS SQL Server connection successful!");
      cliLogger.info(`Connection pool max size: ${pool.pool.max}`);

      const startTime = Date.now();
      await Promise.all(
        Array.from(new Array(pool.pool.max)).map(() =>
          pool.request().query("SELECT 1")
        )
      );

      const elapsedTime = (Date.now() - startTime) / 1000;
      cliLogger.info(`Connection pool warmed in: ${elapsedTime}s`);
    }
  },
};

// For Windows authentication to trusted connection to true
if (process.env.DB_AUTH_TYPE.toUpperCase() === "WINDOWS")
  dbConfig.connection.options.trustedConnection = true;

export const mssqlPool = [];

export const mssql = (existingPool = undefined) => {
  if (mssqlPool.length === 0)
    new GlobalError(
      "No connection pool found. Please make sure DB connection has established.",
      500
    );

  const [pool] = mssqlPool;

  return {
    preparedStatement: new sql.PreparedStatement(
      existingPool ? existingPool : pool
    ),
    transaction: new sql.Transaction(existingPool ? existingPool : pool),
    request: new sql.Request(existingPool ? existingPool : pool),
  };
};

export const mssqlDataTypes = {
  NVARCHAR: sql.NVarChar,
  VARCHAR: sql.VarChar,
  DATE: sql.Date,
  TIME: sql.Time,
  INT: sql.Int,
  BIT: sql.Bit,
  DATETIMEOFFSET: sql.DateTimeOffset,
};

export default dbConfig;

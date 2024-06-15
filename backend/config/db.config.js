import sql from "mssql/msnodesqlv8.js";
import GlobalError from "../errors/globalError.js";

const dbConfig = {
  driver: "msnodesqlv8",
  server:
    process.env.DB_PORT !== "" && process.env.DB_SERVER.includes("\\")
      ? `${process.env.DB_SERVER},${process.env.DB_PORT}`
      : process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT !== "" ? process.env.DB_PORT : undefined,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
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

export const connectToDB = async () => {
  const pool = await new sql.ConnectionPool(dbConfig).connect();
  if (pool.connected) {
    console.log("MS SQL Server connection successful!");
    console.log("Pool max size:", pool.pool.max);
    mssqlPool.push(pool);

    console.time("Pool warmed in");
    await Promise.all(
      Array.from(new Array(pool.pool.max)).map(() =>
        pool.request().query("SELECT 1")
      )
    );
    console.timeEnd("Pool warmed in");
  }
};

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
  // if (type === "preparedStatement")
  //   return new sql.PreparedStatement(existingPool ? existingPool : pool);
  // if (type === "transaction")
  //   return new sql.Transaction(existingPool ? existingPool : pool);
  // return new sql.Request(existingPool ? existingPool : pool);
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

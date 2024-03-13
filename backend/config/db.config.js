import sql from "mssql";
import catchAsync from "../api/errors/catchAsync.js";
import GlobalError from "../api/errors/globalError.js";

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  trustServerCertificate: true,
  parseJSON: true,
  // options: {
  //   encrypt: true, // for azure
  //   trustServerCertificate: false, // change to true for local dev / self-signed certs
  // },
};

export const connectToDB = catchAsync(async () => {
  const pool = await new sql.ConnectionPool(dbConfig).connect();
  if (pool.connected) {
    console.log("MS SQL Server connection successful!");
    mssqlPool.push(pool);
  }
});

export const mssqlPool = [];

export const mssql = () => {
  const [pool] = mssqlPool;

  if (mssqlPool.length === 0)
    new GlobalError(
      "Connection pool is not ready. Please try again later.",
      500
    );

  return new sql.Request(pool);
};

export const mssqlDataTypes = {
  NVarChar: sql.NVarChar,
  Int: sql.Int,
  Bit: sql.Bit,
  DateTime: sql.DateTime,
};

export default dbConfig;

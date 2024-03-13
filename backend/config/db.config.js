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
    mssql.push(pool);
  }
});

export const mssql = [];

export const mssqlRequest = () => {
  const [pool] = mssql;

  if (pool.length === 0)
    new GlobalError(
      "Connection pool is not ready. Please try again later.",
      500
    );
  const request = new sql.Request(pool);

  // request.stream = true;
  return request;
};

export const mssqlDataTypes = {
  NVarChar: sql.NVarChar,
  Int: sql.Int,
  Bit: sql.Bit,
  DateTime: sql.DateTime,
};

export default dbConfig;

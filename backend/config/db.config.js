import sql from "mssql";
import catchAsync from "../errors/catchAsync.js";

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

export const mssqlRequest = (res) => {
  const [pool] = mssql;
  const request = new sql.Request(pool);

  // request.stream = true;
  // request.on("error", (err) => {
  //   res.status(400).json({
  //     status: "fail",
  //     message: err,
  //   });
  // });

  return request;
};

export const mssqlDataTypes = {
  NVarChar: sql.NVarChar,
  Int: sql.Int,
  Boolean: sql.Bit,
  DateTime: sql.DateTime,
};

export default dbConfig;

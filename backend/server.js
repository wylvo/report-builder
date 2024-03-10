import sql from "mssql";
import "dotenv/config";

import config from "./config/app.config.js";
import dbConfig from "./config/db.config.js";

process.on("uncaughtException", (err) => {
  console.error("UNHANDLED EXCEPTION...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

import app from "./app.js";

export const pool = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    if (pool.connected) {
      console.log("MS SQL Server connection successful!");
      app.locals.mssql = pool;
      app.locals.mssqlDataTypes = {
        NVarChar: sql.NVarChar,
        Int: sql.Int,
        Boolean: sql.Bit,
        DateTime: sql.DateTime,
      };
    }
  })
  .catch((err) => {
    console.error(err);
  });

const server = app.listen(config.port, () =>
  console.log(
    `Server listening on port ${config.port} at: http://localhost:${config.port}`
  )
);

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION...");
  console.error(err.name, err.message);
  console.error(err.stack);

  server.close(() => {
    process.exit(1);
  });
});

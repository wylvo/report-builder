import "dotenv/config";

import config from "./config/app.config.js";
import * as dbConfig from "./config/db.config.js";

process.on("uncaughtException", (err) => {
  console.error("UNHANDLED EXCEPTION...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

import app from "./app.js";

dbConfig.connectToDB();

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

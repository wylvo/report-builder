import "dotenv/config";

import config from "./config/app.config.js";
import * as dbConfig from "./config/db.config.js";
import { cliLogger, httpLogger } from "./logs/logger.js";

process.on("uncaughtException", (err) => {
  console.error("UNHANDLED EXCEPTION...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

import app from "./app.js";
import * as formData from "./api/v1/formData/formData.controller.js";

const server = app.listen(config.port, () =>
  cliLogger.error(
    `Server listening on port ${config.port} at: http://localhost:${config.port}`
  )
);

dbConfig.connectToDB().then(() => formData.updateFormDataConfig());

process.on("unhandledRejection", (err) => {
  cliLogger.error("Server startup failed!");
  httpLogger.error({
    error: {
      name: "Internal Server Error",
      statusCode: 500,
      error: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  server.close(() => {
    process.exit(1);
  });
});

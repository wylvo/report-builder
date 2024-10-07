import path from "path";

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import {
  cliLogger,
  generateLogId,
  internalServerErrorLog,
} from "./logs/logger.js";

// prettier-ignore
process.on("uncaughtException", (err) => {
  const logId = generateLogId();
  cliLogger.error(`[${logId}] Uncaught exception! ${err.name}: ${err.message}. See error logs folder for more details`);
  internalServerErrorLog("Uncaught exception", err, logId);
});

import config from "./config/server.config.js";
import dbConfig from "./config/db.config.js";
import apiV1Router from "./api/v1/router.js";
import authRouter from "./auth/auth.router.js";
import viewRouter from "./views/view.router.js";
import * as formData from "./api/v1/formData/formData.controller.js";
import globalErrorHandler from "./errors/error.controller.js";
import GlobalError from "./errors/globalError.js";
import responseInterceptor from "./responseInterceptor/responseInterceptor.js";

const app = express();
const __dirname = path.resolve();

// Template views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/backend/views"));

// Static files
app.use(express.static(path.join(__dirname, "/frontend/public")));

// Set security HTTP headers
// app.use(helmet());

app.use(cors());
app.use(compression());
app.use(
  express.json({ limit: config.request.byteLimit, type: config.request.type })
);
app.use(cookieParser());

// Format JSON responses as text with 2 indented spaces
app.set("json spaces", 2);

// Morgan logging
app.use(
  morgan(config.logs.morgan.format, {
    stream: { write: (message) => cliLogger.info(message.trim()) },
  })
);

// Intercept all requests & responses for logging purposes
app.use(responseInterceptor.all);

// Limit requests to the API
const limiter = rateLimit({
  max: config.rateLimiter.maxNumberOfRequests,
  windowMs: config.rateLimiter.windowMilliseconds,
  message: config.rateLimiter.message,
});
app.use("/api", limiter);

app.use("/", viewRouter);
app.use("/auth", authRouter);
app.use("/api/v1", apiV1Router);

app.all("*", (req, res, next) => {
  next(new GlobalError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

cliLogger.info("Attempting to connect to the database...");

// Connect to database then update form data config, finally start the server
// prettier-ignore
dbConfig
  .connectToDB()
  .then(() => {
    cliLogger.info("Updating form data config...");
    formData.updateFormDataConfig();
    cliLogger.info("Form data config updated!");
    cliLogger.info("Starting server...");
    cliLogger.info(`Server port: ${config.port}`);

    let port;
    if (process.env.IISNode.toUpperCase() === "TRUE") port = process.env.PORT
    else port = process.env.SERVER_PORT;

    app.listen(port, () => cliLogger.info(`Server listening on port ${config.port} at: http://localhost:${config.port}`));
  })
  .catch((err) => {
    const logId = generateLogId();
    cliLogger.error(`[${logId}] ${err.name}: ${err.message}. See error logs folder for more details`);
    internalServerErrorLog(err.name, err, logId);
  });

// prettier-ignore
process.on("unhandledRejection", (err) => {
  const logId = generateLogId();
  cliLogger.error(`[${logId}] Unhandled rejection! ${err.name}: ${err.message}. See error logs folder for more details`);
  internalServerErrorLog("Unhandled rejection", err, logId);

  process.exit(1);
});

export default app;

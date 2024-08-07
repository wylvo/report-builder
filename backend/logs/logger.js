import { randomBytes } from "crypto";

import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import config from "../config/server.config.js";

const { label, colorize, combine, timestamp, json, errors, printf } = format;
const timestampFormat = "YYYY-MMM-DD HH:mm:ss.SSS";

const appVersion = process.env.npm_package_version;
export const generateLogId = () => randomBytes(16).toString("hex");

// Logger for HTTP requests
export const httpLogger = winston.createLogger({
  format: combine(
    timestamp({ format: timestampFormat }),
    json(),
    printf(({ timestamp, level, message, ...data }) => {
      const response = {
        level,
        logId: generateLogId(),
        timestamp,
        appInfo: {
          appVersion,
          environment: process.env.NODE_ENV,
          proccessId: process.pid,
        },
        message,
        data,
      };

      // indenting logs for better readbility
      return JSON.stringify(response, null, 2);
    })
  ),
  transports: [
    // log to file, but rotate daily
    new DailyRotateFile({
      filename: config.logs.http.filename,
      dirname: config.logs.http.dirname,
      datePattern: config.logs.http.datePattern,
      zippedArchive: config.logs.http.zippedArchive,
      maxSize: config.logs.http.maxSize,
    }),
  ],
});

// Logger for CLI outputs
export const cliLogger = winston.createLogger({
  format: combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    label({ label: appVersion }),
    timestamp({ format: timestampFormat }),
    colorize({ level: true }),
    errors({ stack: true }),
    printf(
      ({ level, message, label, timestamp, ...data }) =>
        `[${timestamp}][${level}] (${label}): ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),

    new DailyRotateFile({
      format: combine(format.uncolorize()),
      filename: config.logs.general.filename,
      dirname: config.logs.general.dirname,
      datePattern: config.logs.general.datePattern,
      zippedArchive: config.logs.general.zippedArchive,
      maxSize: config.logs.general.maxSize,
    }),
  ],
});

// Logger for server errors
export const errorLogger = winston.createLogger({
  format: combine(
    timestamp({ format: timestampFormat }),
    json(),
    errors({ stack: true }),
    printf(({ level, message, timestamp, ...data }) => {
      const logDetails = {
        level,
        timestamp,
        appInfo: {
          appVersion,
          environment: process.env.NODE_ENV,
          proccessId: process.pid,
        },
        message,
        data,
      };

      return JSON.stringify(logDetails, null, 2);
    })
  ),

  transports: [
    new DailyRotateFile({
      level: "error",
      format: combine(format.uncolorize()),

      filename: config.logs.error.filename,
      dirname: config.logs.error.dirname,
      datePattern: config.logs.error.datePattern,
      zippedArchive: config.logs.error.zippedArchive,
      maxSize: config.logs.error.maxSize,
    }),
  ],
});

// Pre-defined error
export const internalServerErrorLog = (message, err, logId) => {
  errorLogger.error(message, {
    error: {
      name: "Internal Server Error",
      logId,
      statusCode: 500,
      error: err.name,
      message: err.message,
      stack: err.stack,
    },
  });
};

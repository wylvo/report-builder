import { randomBytes } from "crypto";

import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import config from "../config/server.config.js";

const { label, colorize, combine, timestamp, json, errors, printf } = format;

const timestampFormat = config.logs.winston.timestampFormat;

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
      filename: config.logs.winston.http.filename,
      dirname: config.logs.winston.http.dirname,
      datePattern: config.logs.winston.http.datePattern,
      zippedArchive: config.logs.winston.http.zippedArchive,
      maxSize: config.logs.winston.http.maxSize,
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
    label({ label: config.logs.winston.label }),
    timestamp({ format: timestampFormat }),
    config.logs.winston.cli.colorize.level ||
      config.logs.winston.cli.colorize.all
      ? colorize(config.logs.winston.cli.colorize)
      : format.uncolorize(),
    errors({ stack: true }),
    printf(config.logs.winston.cli.format)
  ),
  transports: [
    new winston.transports.Console(),

    new DailyRotateFile({
      format: combine(format.uncolorize()),
      filename: config.logs.winston.general.filename,
      dirname: config.logs.winston.general.dirname,
      datePattern: config.logs.winston.general.datePattern,
      zippedArchive: config.logs.winston.general.zippedArchive,
      maxSize: config.logs.winston.general.maxSize,
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

      filename: config.logs.winston.error.filename,
      dirname: config.logs.winston.error.dirname,
      datePattern: config.logs.winston.error.datePattern,
      zippedArchive: config.logs.winston.error.zippedArchive,
      maxSize: config.logs.winston.error.maxSize,
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

import { randomBytes } from "crypto";

import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { label, colorize, combine, timestamp, json, printf } = format;
const timestampFormat = "MMM-DD-YYYY HH:mm:ss.SSS";

const appVersion = process.env.npm_package_version;
const generateLogId = () => randomBytes(16).toString("hex");

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
      filename: "backend/logs/server-logs-%DATE%.log", // file name includes current date
      datePattern: "MMMM-DD-YYYY",
      zippedArchive: false, // zip logs true/false
      maxSize: "20m", // rotate if file size exceeds 20 MB
      maxFiles: "14d", // max files
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
    printf(
      ({ level, message, label, timestamp }) =>
        `[${timestamp}][${level}][v${label}]: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});

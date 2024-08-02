import { randomBytes } from "crypto";

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, printf } = winston.format;
const timestampFormat = "MMM-DD-YYYY HH:mm:ss";

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
    // log to console
    new winston.transports.Console(),

    // log to file, but rotate daily
    new DailyRotateFile({
      filename: "backend/logs/application-logs-%DATE%.log", // file name includes current date
      datePattern: "MMMM-DD-YYYY",
      zippedArchive: false, // zip logs true/false
      maxSize: "20m", // rotate if file size exceeds 20 MB
      maxFiles: "14d", // max files
    }),
  ],
});

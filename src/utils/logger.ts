import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import config from "../config";
import fs from "fs";

const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const isDev = config.NODE_ENV !== "production";
const logLevel = config.LOG_LEVEL || "info";

// Custom formatter that includes metadata
const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
});

const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true })
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json()
      ),
    }),
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      level: "error",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json()
      ),
    }),
  ],
  exitOnError: false,
});

if (isDev) {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    })
  );
}

logger.exceptions.handle(
  new transports.File({ filename: path.join(logDir, "exceptions.log") })
);

logger.rejections.handle(
  new transports.File({ filename: path.join(logDir, "rejections.log") })
);

export default logger;

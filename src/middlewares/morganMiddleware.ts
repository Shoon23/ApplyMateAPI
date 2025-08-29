import morgan from "morgan";
import { Request, Response } from "express";
import logger from "../utils/logger";

interface LogData {
  method: string;
  url: string;
  status: number;
  content_length: string;
  response_time: number;
  message: string;
}

const formatLog = (tokens: any, req: Request, res: Response): string => {
  const method = tokens.method(req, res) || "";
  const url = tokens.url(req, res) || "";
  const status = parseFloat(tokens.status(req, res) || "0");
  const contentLength = tokens.res(req, res, "content-length") || "0";
  const responseTime = parseFloat(tokens["response-time"](req, res) || "0");

  const logData: LogData = {
    method,
    url,
    status,
    content_length: contentLength,
    response_time: responseTime,
    message: `${method} ${url} ${status} - ${responseTime} ms`,
  };

  return JSON.stringify(logData);
};

const morganMiddleware = morgan(formatLog, {
  immediate: true,
  stream: {
    write: (message: string) => {
      const data = JSON.parse(message);
      logger.http(data);
    },
  },
});

export default morganMiddleware;

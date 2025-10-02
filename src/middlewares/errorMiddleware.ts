import { ErrorRequestHandler } from "express";
import CustomError from "../errors/CustomError";
import logger from "../utils/logger";
import config from "../config";

const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);
  // logger.error(err, {
  //   ...(config.NODE_ENV === "development" && {
  //     stack: err.stack,
  //   }),
  //   name: err.name,
  //   path: req.path,
  //   method: req.method,
  // });
  if (err instanceof CustomError) {
    return res
      .status(err.statusCode)
      .json({ errorType: err.errorType, errors: err.serializeErrors() });
  }

  res.status(500).json({
    errorType: "INTERNAL_SERVER_ERROR",
    errors: [{ message: "Something went wrong" }],
  });
};

export default errorMiddleware;

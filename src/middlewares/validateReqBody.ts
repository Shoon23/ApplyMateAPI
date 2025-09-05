import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import ValidationError from "../errors/ValidationError";
import Joi from "joi";

export const validateReqBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn("Validation Failed", {
        url: req.path,
      });
      const errors = error.details.map((err) => ({
        message: err.message,
        property: err.path[0],
      }));
      throw new ValidationError(errors as any);
    }
    req.body = value;
    next();
  };
};

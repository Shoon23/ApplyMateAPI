import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import ValidationError from "../errors/ValidationError";
import Joi from "joi";

export const validateReqBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ValidationError([
        {
          message: "Request body is required",
          property: "body",
        },
      ]);
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
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

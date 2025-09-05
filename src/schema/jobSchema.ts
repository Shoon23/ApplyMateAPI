import { JobApplication, Status } from "../../generated/prisma";
import Joi from "joi";
export const JobApplicationSchema = Joi.object({
  company: Joi.string().min(2).max(100).required().messages({
    "string.min": "Company name must be at least 2 characters long",
    "string.max": "Company name must be less than or equal to 100 characters",
    "string.empty": "Company name is required",
    "any.required": "Company name is required",
  }),

  position: Joi.string().min(2).max(100).required().messages({
    "string.min": "Position must be at least 2 characters long",
    "string.max": "Position must be less than or equal to 100 characters",
    "string.empty": "Position is required",
    "any.required": "Position is required",
  }),

  source: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Source must be less than or equal to 100 characters",
  }),

  status: Joi.string()
    .valid(...Object.values(Status))
    .required()
    .messages({
      "any.only": `Status must be one of: ${Object.values(Status).join(", ")}`,
      "any.required": "Status is required",
    }),

  appliedDate: Joi.date().allow(null).messages({
    "date.base": "Applied date must be a valid date",
  }),

  deadline: Joi.date().allow(null).messages({
    "date.base": "Deadline must be a valid date",
  }),

  contactName: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Contact name must be less than or equal to 100 characters",
  }),

  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null, "")
    .messages({
      "string.email": "Invalid contact email",
    }),
});

export const JobApplicationID = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Job ID is required",
    "any.required": "Job ID is required",
  }),
});
export type JobApplicationType = {
  company: string;
  position: string;
  source: string | null;
  status: Status;
  appliedDate: Date | null;
  deadline: Date | null;
  contactName: string | null;
  contactEmail: string | null;
};

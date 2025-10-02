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
  description: Joi.string().allow(null, "").messages({
    "string.base": "Description must be a text",
    "string.empty": "Description cannot be empty",
  }),

  salary: Joi.number().allow(null, 0).messages({
    "number.base": "Salary must be a number",
    "number.min": "Salary cannot be less than 0",
  }),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null, "")
    .messages({
      "string.email": "Invalid contact email",
    }),
}).required();

export const JobApplicationID = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "Job ID is required",
    "any.required": "Job ID is required",
  }),
}).required();
export const JobQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  search: Joi.string().allow("").messages({
    "string.base": "Search must be a string",
  }),

  sortBy: Joi.string()
    .valid(...Object.values(Status))
    .default(Status.APPLIED)
    .messages({
      "any.only": `SortBy must be one of: ${Object.values(Status).join(", ")}`,
    }),

  order: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Order must be either asc or desc",
  }),
}).required();

export const UpdateJobApplicationSchema = Joi.object({
  company: Joi.string().min(2).max(100).messages({
    "string.min": "Company name must be at least 2 characters long",
    "string.max": "Company name must be less than or equal to 100 characters",
  }),

  position: Joi.string().min(2).max(100).messages({
    "string.min": "Position must be at least 2 characters long",
    "string.max": "Position must be less than or equal to 100 characters",
  }),

  source: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Source must be less than or equal to 100 characters",
  }),

  status: Joi.string()
    .valid(...Object.values(Status))
    .messages({
      "any.only": `Status must be one of: ${Object.values(Status).join(", ")}`,
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
  description: Joi.string().allow(null, "").messages({
    "string.base": "Description must be a text",
    "string.empty": "Description cannot be empty",
  }),

  salary: Joi.number().allow(null, 0).messages({
    "number.base": "Salary must be a number",
    "number.min": "Salary cannot be less than 0",
  }),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null, "")
    .messages({
      "string.email": "Invalid contact email",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to update",
  });

export type UpdateJobApplicationType = {
  company?: string;
  position?: string;
  source?: string | null;
  status?: Status;
  appliedDate?: Date | null;
  deadline?: Date | null;
  contactName?: string | null;
  contactEmail?: string | null;
};
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

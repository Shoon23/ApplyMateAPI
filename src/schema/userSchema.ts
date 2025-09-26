import Joi from "joi";

export const UserProfileIDSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "User Profile ID is required",
    "any.required": "User Profile is required",
  }),
}).required();

export const UpdateUserProfileSchema = Joi.object({
  contact: Joi.object({
    name: Joi.string().allow(null),
    email: Joi.string().email().allow(null).messages({
      "string.email": "Contact email must be a valid email address",
    }),
    phone: Joi.string().allow(null),
    linkedin: Joi.string().uri().allow(null).messages({
      "string.uri": "LinkedIn must be a valid URL",
    }),
  }),

  skills: Joi.array().items(Joi.string()).allow(null),

  experience: Joi.array()
    .items(
      Joi.object({
        company: Joi.string().allow(null),
        role: Joi.string().allow(null),
        startDate: Joi.string().allow(null),
        endDate: Joi.string().allow(null),
        achievements: Joi.array().items(Joi.string()).allow(null),
      })
    )
    .allow(null),

  education: Joi.array()
    .items(
      Joi.object({
        degree: Joi.string().allow(null),
        institution: Joi.string().allow(null),
        year: Joi.string().allow(null),
      })
    )
    .allow(null),
})
  .min(1) // ensure at least one key is present
  .messages({
    "object.min":
      "At least one of contact, skills, experience, or education is required",
  });

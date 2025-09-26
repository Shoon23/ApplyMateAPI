import Joi from "joi";

export const UserProfileIDSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "User Profile ID is required",
    "any.required": "User Profile is required",
  }),
}).required();

const contactSchema = Joi.object({
  name: Joi.string().optional().messages({
    "string.base": "Contact name must be a string",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Contact email must be a valid email address",
  }),
  phone: Joi.string().optional().messages({
    "string.base": "Contact phone must be a string",
  }),
  linkedin: Joi.string().optional().messages({
    "string.base": "Contact LinkedIn must be a string",
  }),
}).optional();

// ------------------ Skill ------------------
const skillSchema = Joi.object({
  id: Joi.string().optional().messages({
    "string.base": "Skill id must be a string",
  }),
  name: Joi.string().required().messages({
    "any.required": "Skill name is required",
    "string.base": "Skill name must be a string",
  }),
});

const experienceSchema = Joi.object({
  id: Joi.string().optional().messages({
    "string.base": "Experience id must be a string",
  }),
  company: Joi.string().optional().messages({
    "string.base": "Experience company must be a string",
  }),
  role: Joi.string().optional().messages({
    "string.base": "Experience role must be a string",
  }),
  startDate: Joi.date().optional().messages({
    "date.base": "Experience startDate must be a valid date",
  }),
  endDate: Joi.date().optional().messages({
    "date.base": "Experience endDate must be a valid date",
  }),
  achievements: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Experience achievements must be an array of strings",
    "string.base": "Each achievement must be a string",
  }),
});

const educationSchema = Joi.object({
  id: Joi.string().optional().messages({
    "string.base": "Education id must be a string",
  }),
  degree: Joi.string().optional().messages({
    "string.base": "Education degree must be a string",
  }),
  institution: Joi.string().optional().messages({
    "string.base": "Education institution must be a string",
  }),
  year: Joi.string().optional().messages({
    "string.base": "Education year must be a string",
  }),
});

export const UpdateUserProfileSchema = Joi.object({
  contact: contactSchema,
  skills: hybridSchema(skillSchema),
  experience: hybridSchema(experienceSchema),
  education: hybridSchema(educationSchema),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });
function hybridSchema(itemSchema: Joi.ObjectSchema) {
  return Joi.alternatives().try(
    Joi.array().items(itemSchema).messages({
      "array.base": "Must be an array of valid items",
    }),
    Joi.object({
      add: Joi.array().items(itemSchema).optional().messages({
        "array.base": "Add must be an array of valid items",
        "object.base": "Each item in add must match the schema",
      }),
      remove: Joi.array().items(Joi.string()).optional().messages({
        "array.base": "Remove must be an array of IDs",
        "string.base": "Each ID in remove must be a string",
      }),
    }).messages({
      "object.base": "Must be an object with optional add/remove arrays",
    })
  );
}

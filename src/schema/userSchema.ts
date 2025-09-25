import Joi from "joi";

export const UserProfileIDSchema = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "User Profile ID is required",
    "any.required": "User Profile is required",
  }),
}).required();

const Joi = require("joi");

const userSchema = Joi.object({
  usrname: Joi.string().trim().required().messages({
    "string.empty": "User name is required.",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Email must be valid.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 6 characters.",
  }),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone must be a 10-digit number.",
      "string.empty": "Phone is required.",
    }),
  remember: Joi.boolean().required(),
  function: Joi.string().optional(),
  newsletter: Joi.string().allow("").optional(),
});

const signInSchema = Joi.object({
  identifier: Joi.string().trim().required().messages({
    "string.empty": "Identifier (UserID, Email, or Phone) is required.",
  }),
  password: Joi.when("identifier", {
    is: Joi.string().pattern(/^\d{12}$/),
    then: Joi.string().trim().required().messages({
      "string.empty": "Password is required when signing in with User ID.",
    }),
    otherwise: Joi.string().trim().allow("", null),
  }),
});

module.exports = { userSchema, signInSchema };

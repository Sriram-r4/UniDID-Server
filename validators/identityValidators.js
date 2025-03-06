const Joi = require("joi");

const validateIdentity = (data) => {
  const schema = Joi.object({
    category: Joi.string()
      .valid("Government IDs", "Educational IDs", "Socials", "Others")
      .required(),
    dateAdded: Joi.string().isoDate().required(),
    dateOfIssue: Joi.when("category", {
      is: Joi.valid("Government IDs", "Educational IDs"),
      then: Joi.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .required(),
      otherwise: Joi.string().allow("").optional(),
    }),
    function: Joi.string().required(),
    idOwned: Joi.string().valid("You", "Others").required(),
    identityType: Joi.when("category", {
      is: "Others",
      then: Joi.string().trim().required(),
      otherwise: Joi.string().trim().allow("").optional(),
    }),
    idname: Joi.string().trim().required(),
    idnum: Joi.when("category", {
      is: Joi.valid("Government IDs", "Educational IDs"),
      then: Joi.string().trim().required(),
      otherwise: Joi.when("category", {
        is: "Others",
        then: Joi.when("identityType", {
          is: "Number Based",
          then: Joi.string().trim().required(),
          otherwise: Joi.string().trim().allow("").optional(),
        }),
        otherwise: Joi.string().trim().allow("").optional(),
      }),
    }),
    password: Joi.when("category", {
      is: "Socials",
      then: Joi.string().min(6).max(50).required(),
      otherwise: Joi.when("category", {
        is: "Others",
        then: Joi.when("identityType", {
          is: "Password Based",
          then: Joi.string().min(6).max(50).required(),
          otherwise: Joi.string().allow("").optional(),
        }),
        otherwise: Joi.string().allow("").optional(),
      }),
    }),
    username: Joi.when("category", {
      is: "Socials",
      then: Joi.string().trim().required(),
      otherwise: Joi.when("category", {
        is: "Others",
        then: Joi.when("identityType", {
          is: "Password Based",
          then: Joi.string().trim().required(),
          otherwise: Joi.string().trim().allow("").optional(),
        }),
        otherwise: Joi.string().trim().allow("").optional(),
      }),
    }),
    webUrl: Joi.string().uri().allow(null, ""),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = validateIdentity;

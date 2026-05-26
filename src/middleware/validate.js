const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message);
    return res.status(400).json({ errors: messages });
  }
  next();
};

const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).alphanum().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message("Password must have uppercase, lowercase, and a number")
      .required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  post: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).max(10000).required(),
  }),
};

module.exports = { validate, schemas };

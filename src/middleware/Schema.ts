import Joi from "joi"

export const signUpSchema = Joi.object({
    password: Joi.string()
    .min(8)
    .max(60)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')),
    username: Joi.string()
    .required()
    .min(5)
    .max(20),
    role: Joi.string().required(),
    code: Joi.string().required()
})

export const loginSchema = Joi.object({
    identifier: Joi.string()
    .required()
    .min(5)
    .max(20),
    password: Joi.string()
    .min(8)
    .max(60)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
})

export const tempSchema = Joi.object({
    username: Joi.string()
    .required()
    .min(6)
    .max(60),
    code: Joi.string(),
})
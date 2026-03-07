const { z } = require("zod");

const registerSchema = z.object({
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(12, "Mot de passe trop court (12 caractères minimum)"),
});

const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

module.exports = { registerSchema, loginSchema };

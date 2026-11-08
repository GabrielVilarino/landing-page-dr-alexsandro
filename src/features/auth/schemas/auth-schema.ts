import { z } from "zod";

import { passwordPolicySchema } from "@/lib/password-policy";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual."),
    new_password: passwordPolicySchema,
    confirmation: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.new_password === data.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function normalizeLogin(values: LoginInput) {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

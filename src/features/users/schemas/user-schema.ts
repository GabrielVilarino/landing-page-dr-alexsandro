import { z } from "zod";

import { passwordPolicySchema } from "@/lib/password-policy";

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome completo."),
    email: z.string().trim().email("Informe um e-mail válido."),
    password: passwordPolicySchema,
    confirmation: z.string().min(1, "Confirme a senha temporária."),
    role_ids: z.array(z.number()).min(1, "Selecione ao menos um papel."),
  })
  .refine((data) => data.password === data.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const userRolesSchema = z.object({
  role_ids: z.array(z.number()).min(1, "Selecione ao menos um papel."),
});

export const resetPasswordSchema = z
  .object({
    temporary_password: passwordPolicySchema,
    confirmation: z.string().min(1, "Confirme a senha temporária."),
  })
  .refine((data) => data.temporary_password === data.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserRolesInput = z.infer<typeof userRolesSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

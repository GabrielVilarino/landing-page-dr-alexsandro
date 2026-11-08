import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do papel."),
  description: z.string().trim().max(240, "Use no máximo 240 caracteres."),
  permission_ids: z.array(z.number()),
});

export type RoleInput = z.infer<typeof roleSchema>;

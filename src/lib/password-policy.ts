import { z } from "zod";

export const passwordPolicySchema = z
  .string()
  .min(8, "Use no mínimo 8 caracteres.")
  .regex(/\p{Lu}/u, "Inclua ao menos uma letra maiúscula.")
  .regex(/\p{Ll}/u, "Inclua ao menos uma letra minúscula.")
  .regex(/\p{Nd}/u, "Inclua ao menos um número.")
  .regex(/[^\p{L}\p{N}\s]/u, "Inclua ao menos um caractere especial.");

export const passwordPolicyDescription =
  "Use ao menos 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.";

import { describe, expect, it } from "bun:test";

import {
  createUserSchema,
  resetPasswordSchema,
} from "@/features/users/schemas/user-schema";

describe("schemas de colaboradores", () => {
  it("exige pelo menos um papel na criação", () => {
    const result = createUserSchema.safeParse({
      name: "Maria da Silva",
      email: "maria@exemplo.com",
      password: "Senha#2026",
      confirmation: "Senha#2026",
      role_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it("aplica a política atual à senha temporária", () => {
    const validResult = resetPasswordSchema.safeParse({
      temporary_password: "Senha#2026",
      confirmation: "Senha#2026",
    });
    const invalidResult = resetPasswordSchema.safeParse({
      temporary_password: "senha-temporaria",
      confirmation: "senha-temporaria",
    });

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });
});

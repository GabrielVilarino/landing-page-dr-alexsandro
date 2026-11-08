import { describe, expect, it } from "bun:test";

import {
  changePasswordSchema,
  loginSchema,
  normalizeLogin,
} from "@/features/auth/schemas/auth-schema";

describe("schemas de autenticação", () => {
  it("normaliza e-mail antes do login", () => {
    const values = loginSchema.parse({
      email: "  ADMIN@Exemplo.com ",
      password: "segredo",
    });
    expect(normalizeLogin(values)).toEqual({
      email: "admin@exemplo.com",
      password: "segredo",
    });
  });

  it("aceita senha que atende à política atual", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "senha-atual",
      new_password: "Senha#2026",
      confirmation: "Senha#2026",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita senha que não atende a cada critério", () => {
    const invalidPasswords = [
      "Ab1#def",
      "senha#2026",
      "SENHA#2026",
      "Senha#abcd",
      "Senha2026",
    ];

    invalidPasswords.forEach((new_password) => {
      const result = changePasswordSchema.safeParse({
        current_password: "senha-atual",
        new_password,
        confirmation: new_password,
      });
      expect(result.success).toBe(false);
    });
  });

  it("rejeita confirmação diferente", () => {
    const result = changePasswordSchema.safeParse({
      current_password: "senha-atual",
      new_password: "Senha#2026",
      confirmation: "Outra#2026",
    });
    expect(result.success).toBe(false);
  });
});

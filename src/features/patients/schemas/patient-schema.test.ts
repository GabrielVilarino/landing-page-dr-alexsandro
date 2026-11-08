import { describe, expect, test } from "bun:test";

import {
  isValidCpf,
  patientFormSchema,
  patientSearchSchema,
} from "@/features/patients/schemas/patient-schema";

const validPatient = {
  mode: "create" as const,
  full_name: "Maria da Silva",
  cpf: "529.982.247-25",
  birth_date: "1990-01-02",
  phone: "(63) 99999-9999",
  email: "maria@example.com",
  guardians: [],
};

describe("patientFormSchema", () => {
  test("aceita um CPF válido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(patientFormSchema.safeParse(validPatient).success).toBe(true);
  });

  test("rejeita CPF inválido no cadastro", () => {
    expect(
      patientFormSchema.safeParse({ ...validPatient, cpf: "111.111.111-11" })
        .success,
    ).toBe(false);
  });

  test("permite CPF vazio na edição para preservar o valor cadastrado", () => {
    expect(
      patientFormSchema.safeParse({ ...validPatient, mode: "update", cpf: "" })
        .success,
    ).toBe(true);
  });

  test("rejeita data futura ou inexistente", () => {
    expect(
      patientFormSchema.safeParse({ ...validPatient, birth_date: "2999-01-01" })
        .success,
    ).toBe(false);
    expect(
      patientFormSchema.safeParse({ ...validPatient, birth_date: "2024-02-31" })
        .success,
    ).toBe(false);
  });

  test("rejeita mais de um responsável principal", () => {
    const guardian = {
      name: "Responsável",
      document: "",
      document_masked: null,
      remove_document: false,
      phone: "",
      email: "",
      relationship: "",
      is_primary: true,
    };
    expect(
      patientFormSchema.safeParse({
        ...validPatient,
        guardians: [guardian, { ...guardian, name: "Outro responsável" }],
      }).success,
    ).toBe(false);
  });
});

describe("patientSearchSchema", () => {
  test("aceita nome ou ID e rejeita CPF", () => {
    expect(patientSearchSchema.safeParse("Maria").success).toBe(true);
    expect(patientSearchSchema.safeParse("42").success).toBe(true);
    expect(patientSearchSchema.safeParse("123456789012").success).toBe(true);
    expect(patientSearchSchema.safeParse("529.982.247-25").success).toBe(false);
    expect(patientSearchSchema.safeParse("52998224725").success).toBe(false);
  });
});

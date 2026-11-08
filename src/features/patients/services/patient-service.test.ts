import { describe, expect, test } from "bun:test";

import type { PatientFormValues } from "@/features/patients/schemas/patient-schema";
import {
  buildCreatePatientPayload,
  buildUpdatePatientPayload,
} from "@/features/patients/services/patient-service";

const values: PatientFormValues = {
  mode: "update",
  full_name: " Maria da Silva ",
  cpf: "",
  birth_date: "1990-01-02",
  phone: " (63) 99999-9999 ",
  email: " MARIA@EXAMPLE.COM ",
  guardians: [
    {
      id: 7,
      name: " João da Silva ",
      document: "",
      document_masked: "*******7890",
      remove_document: false,
      phone: "",
      email: "",
      relationship: " pai ",
      is_primary: true,
    },
  ],
};

describe("payload de paciente", () => {
  test("não reenvia máscaras e preserva IDs e versão na edição", () => {
    expect(buildUpdatePatientPayload(values, 3)).toEqual({
      full_name: "Maria da Silva",
      birth_date: "1990-01-02",
      phone: "(63) 99999-9999",
      email: "maria@example.com",
      version: 3,
      guardians: [
        {
          id: 7,
          name: "João da Silva",
          relationship: "pai",
          is_primary: true,
        },
      ],
    });
  });

  test("envia documento vazio somente quando a remoção é explícita", () => {
    const payload = buildUpdatePatientPayload(
      {
        ...values,
        guardians: [{ ...values.guardians[0], remove_document: true }],
      },
      3,
    );
    expect(payload.guardians[0].document).toBe("");
  });

  test("normaliza CPF e dados de apresentação na criação", () => {
    const payload = buildCreatePatientPayload({
      ...values,
      mode: "create",
      cpf: "529.982.247-25",
      guardians: [{ ...values.guardians[0], id: undefined, document: "123.456" }],
    });
    expect(payload.cpf).toBe("52998224725");
    expect(payload.email).toBe("maria@example.com");
    expect(payload.guardians[0]).not.toHaveProperty("id");
    expect(payload.guardians[0]).not.toHaveProperty("document_masked");
  });
});

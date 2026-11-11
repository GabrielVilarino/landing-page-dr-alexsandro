import { describe, expect, test } from "bun:test";
import { preAppointmentSchema } from "./pre-appointment-schema";

const valid = { full_name: "Maria da Silva", cpf: "529.982.247-25", birth_date: "1990-01-02", phone: "(63) 99999-9999", email: "maria@exemplo.com", doctor_id: "2", type_id: "1", date: "2026-11-12", start_at: "2026-11-12T09:00:00-03:00" };

describe("pré-agendamento público", () => {
  test("aceita uma solicitação válida", () => expect(preAppointmentSchema.safeParse(valid).success).toBe(true));
  test("recusa pessoa menor de idade", () => expect(preAppointmentSchema.safeParse({ ...valid, birth_date: "2020-01-02" }).success).toBe(false));
  test("recusa data inexistente", () => expect(preAppointmentSchema.safeParse({ ...valid, date: "2026-02-31" }).success).toBe(false));
  test("recusa CPF inválido", () => expect(preAppointmentSchema.safeParse({ ...valid, cpf: "111.111.111-11" }).success).toBe(false));
  test("exige horário selecionado", () => expect(preAppointmentSchema.safeParse({ ...valid, start_at: "" }).success).toBe(false));
});

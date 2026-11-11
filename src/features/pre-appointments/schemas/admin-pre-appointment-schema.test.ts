import { describe, expect, test } from "bun:test";
import { adminPreAppointmentFilterSchema, rejectPreAppointmentSchema } from "./admin-pre-appointment-schema";

describe("filtros de pré-agendamentos", () => {
  test("exige o período completo", () => {
    expect(adminPreAppointmentFilterSchema.safeParse({ status: "PENDENTE", doctor_id: "", start_date: "2026-11-09", end_date: "" }).success).toBe(false);
  });
  test("rejeita período invertido", () => {
    expect(adminPreAppointmentFilterSchema.safeParse({ status: "", doctor_id: "", start_date: "2026-11-10", end_date: "2026-11-09" }).success).toBe(false);
  });
});

describe("recusa de pré-agendamento", () => {
  test("exige motivo e limita a 500 caracteres", () => {
    expect(rejectPreAppointmentSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(rejectPreAppointmentSchema.safeParse({ reason: "x".repeat(501) }).success).toBe(false);
  });
});

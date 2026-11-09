import { describe, expect, test } from "bun:test";
import {
  appointmentCreateSchema,
  blockSchema,
  scheduleSchema,
} from "./appointment-schema";

describe("schemas da agenda", () => {
  test("aceita um agendamento válido", () => {
    expect(
      appointmentCreateSchema.safeParse({
        patient_id: "42",
        doctor_id: "2",
        type_id: "1",
        date: "2026-11-09",
        start_at: "08:00",
        is_fit_in: false,
      }).success,
    ).toBe(true);
  });
  test("impede grade invertida", () => {
    expect(
      scheduleSchema.safeParse({
        doctor_id: "2",
        weekday: "1",
        start_time: "18:00",
        end_time: "08:00",
        slot_interval_minutes: "20",
      }).success,
    ).toBe(false);
  });
  test("exige motivo no bloqueio", () => {
    expect(
      blockSchema.safeParse({
        doctor_id: "2",
        start_at: "2026-11-09T12:00",
        end_at: "2026-11-09T14:00",
        reason: "",
      }).success,
    ).toBe(false);
  });
});

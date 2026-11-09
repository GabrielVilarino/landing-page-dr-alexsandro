import { describe, expect, test } from "bun:test";
import {
  clinicInterval,
  isClinicDate,
  moveClinicDate,
  scheduleBlockInterval,
} from "./appointment-date";

describe("datas da agenda", () => {
  test("rejeita datas vazias e inexistentes sem lançar RangeError", () => {
    expect(isClinicDate("")).toBe(false);
    expect(isClinicDate("2026-02-30")).toBe(false);
    expect(clinicInterval("", "day")).toBeNull();
    expect(moveClinicDate("", 1)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("monta o intervalo semanal com sete dias", () => {
    const interval = clinicInterval("2026-11-09", "week");
    expect(interval?.startDate).toBe("2026-11-08");
    expect(interval?.endDate).toBe("2026-11-15");
  });

  test("limita a consulta de bloqueios a 32 dias", () => {
    const interval = scheduleBlockInterval("2026-11-09");
    const durationInDays =
      (new Date(interval.end_at).getTime() -
        new Date(interval.start_at).getTime()) /
      86_400_000;

    expect(durationInDays).toBe(32);
  });
});

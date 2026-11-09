import { describe, expect, test } from "bun:test";
import { availableAppointmentActions } from "./appointment-rules";

describe("ciclo da consulta", () => {
  test("oferece apenas transições válidas de uma consulta agendada", () => {
    expect(
      availableAppointmentActions("AGENDADA", ["appointments.update"], false),
    ).toEqual(["confirm", "no-show", "cancel", "reschedule"]);
  });
  test("restringe atendimento ao próprio médico", () => {
    expect(
      availableAppointmentActions("CONFIRMADA", ["appointments.attend"], false),
    ).toEqual([]);
    expect(
      availableAppointmentActions("CONFIRMADA", ["appointments.attend"], true),
    ).toEqual(["start"]);
  });
  test("não oferece ações em estados terminais", () => {
    expect(
      availableAppointmentActions(
        "FINALIZADA",
        ["appointments.update", "appointments.attend"],
        true,
      ),
    ).toEqual([]);
  });
});

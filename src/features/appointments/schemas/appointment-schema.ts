import { z } from "zod";

const positiveId = z
  .string()
  .trim()
  .regex(/^\d+$/, "Selecione uma opção válida.");
const requiredReason = z
  .string()
  .trim()
  .min(3, "Informe um motivo com pelo menos 3 caracteres.")
  .max(500, "Use no máximo 500 caracteres.");

export const appointmentCreateSchema = z.object({
  patient_id: positiveId,
  doctor_id: positiveId,
  type_id: positiveId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  start_at: z.string().min(1, "Selecione ou informe um horário."),
  is_fit_in: z.boolean(),
});

export const reasonSchema = z.object({ reason: requiredReason });
export const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data."),
  start_at: z.string().min(1, "Informe o novo horário."),
  reason: requiredReason,
  is_fit_in: z.boolean(),
});
export const appointmentTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(100, "Use no máximo 100 caracteres."),
  duration_minutes: z
    .string()
    .regex(/^\d+$/, "Informe a duração.")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 480,
      "A duração deve ficar entre 1 e 480 minutos.",
    ),
});
export const scheduleSchema = z
  .object({
    doctor_id: positiveId,
    weekday: z.string().regex(/^[0-6]$/, "Selecione o dia."),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o início."),
    end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o fim."),
    slot_interval_minutes: z
      .string()
      .regex(/^\d+$/, "Informe o intervalo.")
      .refine((value) => Number(value) > 0, "O intervalo deve ser positivo."),
  })
  .refine((value) => value.end_time > value.start_time, {
    message: "O fim deve ser posterior ao início.",
    path: ["end_time"],
  });
export const blockSchema = z
  .object({
    doctor_id: positiveId,
    start_at: z.string().min(1, "Informe o início."),
    end_at: z.string().min(1, "Informe o fim."),
    reason: requiredReason,
  })
  .refine((value) => value.end_at > value.start_at, {
    message: "O fim deve ser posterior ao início.",
    path: ["end_at"],
  });

export type AppointmentCreateValues = z.infer<typeof appointmentCreateSchema>;
export type ReasonValues = z.infer<typeof reasonSchema>;
export type RescheduleValues = z.infer<typeof rescheduleSchema>;
export type AppointmentTypeValues = z.infer<typeof appointmentTypeSchema>;
export type ScheduleValues = z.infer<typeof scheduleSchema>;
export type BlockValues = z.infer<typeof blockSchema>;

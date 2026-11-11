import { z } from "zod";
import { isClinicDate } from "@/features/appointments/services/appointment-date";
import { preAppointmentStatuses } from "@/features/pre-appointments/types/pre-appointment";

const date = z.string().refine((value) => value === "" || isClinicDate(value), "Informe uma data válida.");

export const adminPreAppointmentFilterSchema = z.object({
  status: z.enum(preAppointmentStatuses).or(z.literal("")),
  doctor_id: z.string(),
  start_date: date,
  end_date: date,
}).superRefine((value, context) => {
  if ((value.start_date === "") !== (value.end_date === "")) {
    context.addIssue({ code: "custom", path: [value.start_date === "" ? "start_date" : "end_date"], message: "Informe o início e o fim do período." });
  }
  if (value.start_date && value.end_date && value.start_date > value.end_date) {
    context.addIssue({ code: "custom", path: ["end_date"], message: "O fim deve ser igual ou posterior ao início." });
  }
});

export const rejectPreAppointmentSchema = z.object({
  reason: z.string().trim().min(1, "Informe o motivo da recusa.").max(500, "Use no máximo 500 caracteres."),
});

export type AdminPreAppointmentFilters = z.infer<typeof adminPreAppointmentFilterSchema>;
export type RejectPreAppointmentValues = z.infer<typeof rejectPreAppointmentSchema>;

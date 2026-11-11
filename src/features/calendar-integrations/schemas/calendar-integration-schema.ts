import { z } from "zod";

export const calendarSelectionSchema = z.object({
  doctor_id: z.number().int().positive(),
  calendar_id: z.string().trim().min(1, "Selecione um calendário."),
});

export type CalendarSelectionValues = z.infer<
  typeof calendarSelectionSchema
>;

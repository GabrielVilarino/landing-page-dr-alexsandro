import { z } from "zod";
import { isValidCpf } from "@/features/patients/schemas/patient-schema";
import { isClinicDate } from "@/features/appointments/services/appointment-date";

const clinicDateSchema = z.string().refine(isClinicDate, "Informe uma data válida.");

function isAdult(value: string) {
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayNotReached =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (birthdayNotReached) age -= 1;
  return age >= 18;
}

export const preAppointmentSchema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo.").max(150, "Use até 150 caracteres."),
  cpf: z.string().trim().max(14, "Informe um CPF válido.").refine(isValidCpf, "Informe um CPF válido."),
  birth_date: clinicDateSchema.refine(isAdult, "Você precisa ter 18 anos ou mais."),
  phone: z.string().trim().min(10, "Informe um telefone válido.").max(20, "Informe um telefone válido."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "Informe um e-mail válido."),
  doctor_id: z.string().min(1, "Selecione o médico."),
  type_id: z.string().min(1, "Selecione o tipo de consulta."),
  date: clinicDateSchema,
  start_at: z.string().min(1, "Selecione um horário."),
});

export type PreAppointmentForm = z.infer<typeof preAppointmentSchema>;

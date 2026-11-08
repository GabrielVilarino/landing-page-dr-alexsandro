import { z } from "zod";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

function isRealNonFutureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= todayUtc
  );
}

export const guardianFormSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Informe o nome do responsável.").max(150, "Use no máximo 150 caracteres."),
  document: z.string().trim(),
  document_masked: z.string().nullable().optional(),
  remove_document: z.boolean(),
  phone: z.string().trim().max(30, "Use no máximo 30 caracteres."),
  email: z
    .string()
    .trim()
    .max(254, "Use no máximo 254 caracteres.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Informe um e-mail válido."),
  relationship: z.string().trim(),
  is_primary: z.boolean(),
});

export const patientFormSchema = z
  .object({
    mode: z.enum(["create", "update"]),
    full_name: z.string().trim().min(1, "Informe o nome completo.").max(150, "Use no máximo 150 caracteres."),
    cpf: z.string().trim().max(20, "Informe um CPF válido."),
    birth_date: z.string().refine(isRealNonFutureDate, "Informe uma data existente e não futura."),
    phone: z.string().trim().min(1, "Informe o telefone.").max(30, "Use no máximo 30 caracteres."),
    email: z.string().trim().min(1, "Informe o e-mail.").max(254, "Use no máximo 254 caracteres.").pipe(z.email("Informe um e-mail válido.")),
    guardians: z.array(guardianFormSchema),
  })
  .superRefine((value, context) => {
    if ((value.mode === "create" || value.cpf !== "") && !isValidCpf(value.cpf)) {
      context.addIssue({ code: "custom", path: ["cpf"], message: "Informe um CPF válido." });
    }
    if (value.guardians.filter((guardian) => guardian.is_primary).length > 1) {
      context.addIssue({ code: "custom", path: ["guardians"], message: "Defina no máximo um responsável principal." });
    }
  });

export const patientSearchSchema = z
  .string()
  .trim()
  .max(150, "Use no máximo 150 caracteres.")
  .refine(
    (value) =>
      value === "" ||
      (!/(?:^|\D)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?:\D|$)/.test(value) &&
        (/[A-Za-zÀ-ÿ]/.test(value) || /^\d+$/.test(value))),
    "Busque somente pelo nome ou pelo ID do paciente.",
  );

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const emptyGuardian: PatientFormValues["guardians"][number] = {
  name: "",
  document: "",
  document_masked: null,
  remove_document: false,
  phone: "",
  email: "",
  relationship: "",
  is_primary: false,
};

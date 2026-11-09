import {
  patientSearchSchema,
  type PatientFormValues,
} from "@/features/patients/schemas/patient-schema";
import type {
  CreateGuardianPayload,
  CreatePatientPayload,
  Patient,
  PatientGuardian,
  PatientHistoryEntry,
  UpdateGuardianPayload,
  UpdatePatientPayload,
} from "@/features/patients/types/patient";
import { apiFetch } from "@/lib/api-client";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function nullableString(value: unknown) {
  return value === undefined || value === null || value === ""
    ? null
    : String(value);
}

function normalizeGuardian(value: unknown): PatientGuardian {
  const item = record(value);
  return {
    id: Number(item.id),
    name: String(item.name ?? ""),
    document_masked: nullableString(item.document_masked),
    phone: nullableString(item.phone),
    email: nullableString(item.email),
    relationship: nullableString(item.relationship),
    is_primary: Boolean(item.is_primary),
  };
}

export function normalizePatient(value: unknown): Patient {
  const item = record(value);
  return {
    id: Number(item.id),
    full_name: String(item.full_name ?? ""),
    cpf_masked: String(item.cpf_masked ?? ""),
    birth_date: String(item.birth_date ?? ""),
    phone: String(item.phone ?? ""),
    email: String(item.email ?? ""),
    guardians: Array.isArray(item.guardians)
      ? item.guardians.map(normalizeGuardian)
      : [],
    version: Number(item.version),
    created_by: Number(item.created_by),
    updated_by: Number(item.updated_by),
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? ""),
  };
}

function normalizeHistoryEntry(value: unknown): PatientHistoryEntry {
  const item = record(value);
  return {
    id: Number(item.id),
    patient_id: Number(item.patient_id),
    version: Number(item.version),
    action: String(item.action ?? ""),
    changed_by: Number(item.changed_by),
    changed_at: String(item.changed_at ?? ""),
    patient: record(item.patient) as Partial<Patient>,
  };
}

function optional(value: string) {
  const normalized = value.trim();
  return normalized === "" ? undefined : normalized;
}

function baseGuardian(
  guardian: PatientFormValues["guardians"][number],
): CreateGuardianPayload {
  return {
    name: guardian.name.trim(),
    ...(optional(guardian.document) !== undefined
      ? { document: optional(guardian.document) }
      : {}),
    ...(optional(guardian.phone) !== undefined
      ? { phone: optional(guardian.phone) }
      : {}),
    ...(optional(guardian.email) !== undefined
      ? { email: optional(guardian.email)?.toLowerCase() }
      : {}),
    ...(optional(guardian.relationship) !== undefined
      ? { relationship: optional(guardian.relationship) }
      : {}),
    is_primary: guardian.is_primary,
  };
}

export function buildCreatePatientPayload(
  values: PatientFormValues,
): CreatePatientPayload {
  return {
    full_name: values.full_name.trim(),
    cpf: values.cpf.replace(/\D/g, ""),
    birth_date: values.birth_date,
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    guardians: values.guardians.map(baseGuardian),
  };
}

export function buildUpdatePatientPayload(
  values: PatientFormValues,
  version: number,
): UpdatePatientPayload {
  return {
    full_name: values.full_name.trim(),
    ...(values.cpf.trim() !== "" ? { cpf: values.cpf.replace(/\D/g, "") } : {}),
    birth_date: values.birth_date,
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    version,
    guardians: values.guardians.map((guardian): UpdateGuardianPayload => {
      const payload: UpdateGuardianPayload = {
        ...baseGuardian(guardian),
        ...(guardian.id !== undefined ? { id: guardian.id } : {}),
      };
      if (guardian.remove_document) payload.document = "";
      return payload;
    }),
  };
}

export const patientService = {
  async list(search = "", limit = 50, offset = 0, signal?: AbortSignal) {
    const normalizedSearch = patientSearchSchema.parse(search);
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (normalizedSearch) params.set("search", normalizedSearch);
    const payload = await apiFetch<unknown>(
      `/gateway/patients?${params.toString()}`,
      {
        signal,
      },
    );
    const container = record(payload);
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(container.items)
        ? container.items
        : Array.isArray(container.data)
          ? container.data
          : [];
    return items.map(normalizePatient);
  },
  async get(id: number) {
    return normalizePatient(await apiFetch<unknown>(`/gateway/patients/${id}`));
  },
  async history(id: number, limit = 50, offset = 0) {
    const payload = await apiFetch<unknown>(
      `/gateway/patients/${id}/history?limit=${limit}&offset=${offset}`,
    );
    const container = record(payload);
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(container.items)
        ? container.items
        : Array.isArray(container.data)
          ? container.data
          : [];
    return items.map(normalizeHistoryEntry);
  },
  async create(values: PatientFormValues) {
    return normalizePatient(
      await apiFetch<unknown>("/gateway/patients", {
        method: "POST",
        body: JSON.stringify(buildCreatePatientPayload(values)),
      }),
    );
  },
  async update(id: number, values: PatientFormValues, version: number) {
    return normalizePatient(
      await apiFetch<unknown>(`/gateway/patients/${id}`, {
        method: "PUT",
        body: JSON.stringify(buildUpdatePatientPayload(values, version)),
      }),
    );
  },
};

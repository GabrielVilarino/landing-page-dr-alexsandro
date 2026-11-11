import { apiFetch } from "@/lib/api-client";
import type {
  CreatePreAppointmentPayload,
  PublicAppointmentType,
  PublicAvailabilitySlot,
  PublicDoctor,
  PreAppointmentResult,
  AdminPreAppointment,
  AdminPreAppointmentQuery,
  PreAppointmentList,
  PreAppointmentStatus,
} from "@/features/pre-appointments/types/pre-appointment";

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function array(value: unknown): unknown[] {
  const item = object(value);
  return Array.isArray(value) ? value : Array.isArray(item.items) ? item.items : Array.isArray(item.data) ? item.data : [];
}

function doctor(value: unknown): PublicDoctor {
  const item = object(value);
  return { id: Number(item.id), name: String(item.name ?? "") };
}

function appointmentType(value: unknown): PublicAppointmentType {
  const item = object(value);
  return { id: Number(item.id), name: String(item.name ?? ""), duration_minutes: Number(item.duration_minutes ?? 0) };
}

function result(value: unknown): PreAppointmentResult {
  const item = object(value);
  return {
    id: Number(item.id),
    status: String(item.status ?? "PENDENTE"),
    ...(item.end_at ? { end_at: String(item.end_at) } : {}),
    ...(item.cpf_masked ? { cpf_masked: String(item.cpf_masked) } : {}),
  };
}

function adminItem(value: unknown): AdminPreAppointment {
  const item = object(value);
  return {
    id: Number(item.id),
    full_name: String(item.full_name ?? ""),
    ...(item.cpf_masked ? { cpf_masked: String(item.cpf_masked) } : {}),
    birth_date: String(item.birth_date ?? ""),
    phone: String(item.phone ?? ""),
    email: String(item.email ?? ""),
    doctor_id: Number(item.doctor_id),
    doctor_name: String(item.doctor_name ?? ""),
    type_id: Number(item.type_id),
    type_name: String(item.type_name ?? ""),
    start_at: String(item.start_at ?? ""),
    end_at: String(item.end_at ?? ""),
    status: String(item.status ?? "PENDENTE") as PreAppointmentStatus,
    ...(item.reviewed_by != null ? { reviewed_by: Number(item.reviewed_by) } : {}),
    ...(item.reviewed_by_name ? { reviewed_by_name: String(item.reviewed_by_name) } : {}),
    ...(item.reviewed_at ? { reviewed_at: String(item.reviewed_at) } : {}),
    ...(item.rejection_reason ? { rejection_reason: String(item.rejection_reason) } : {}),
    ...(item.appointment_id != null ? { appointment_id: Number(item.appointment_id) } : {}),
  };
}

function query(params: Record<string, string | number>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => search.set(key, String(value)));
  return search.toString();
}

export const preAppointmentService = {
  async doctors(signal?: AbortSignal) {
    return array(await apiFetch<unknown>("/backend/public/doctors", { signal })).map(doctor);
  },
  async appointmentTypes(signal?: AbortSignal) {
    return array(await apiFetch<unknown>("/backend/public/appointment-types", { signal })).map(appointmentType);
  },
  async availability(doctorId: number, typeId: number, date: string, signal?: AbortSignal) {
    return array(await apiFetch<unknown>(`/backend/public/appointments/availability?${query({ doctor_id: doctorId, type_id: typeId, date })}`, { signal })).map((value): PublicAvailabilitySlot => ({ start_at: String(object(value).start_at ?? "") }));
  },
  async create(payload: CreatePreAppointmentPayload) {
    return result(await apiFetch<unknown>("/backend/public/pre-appointments", {
      method: "POST",
      body: JSON.stringify({ ...payload, full_name: payload.full_name.trim(), cpf: payload.cpf.replace(/\D/g, ""), phone: payload.phone.trim(), email: payload.email.trim() }),
    }));
  },
  async adminDoctors(signal?: AbortSignal) {
    return array(await apiFetch<unknown>("/gateway/doctors", { signal })).map(doctor);
  },
  async list(params: AdminPreAppointmentQuery, signal?: AbortSignal): Promise<PreAppointmentList> {
    const searchParams: Record<string, string | number> = { limit: params.limit, offset: params.offset };
    if (params.status) searchParams.status = params.status;
    if (params.doctor_id) searchParams.doctor_id = params.doctor_id;
    if (params.start_at) searchParams.start_at = params.start_at;
    if (params.end_at) searchParams.end_at = params.end_at;
    const payload = await apiFetch<unknown>(`/gateway/pre-appointments?${query(searchParams)}`, { signal });
    const container = object(payload);
    const items = array(payload).map(adminItem);
    return { items, ...(typeof container.total === "number" ? { total: container.total } : {}) };
  },
  async approve(id: number) {
    return adminItem(await apiFetch<unknown>(`/gateway/pre-appointments/${id}/approve`, { method: "POST", body: "{}" }));
  },
  async reject(id: number, reason: string) {
    return adminItem(await apiFetch<unknown>(`/gateway/pre-appointments/${id}/reject`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) }));
  },
};

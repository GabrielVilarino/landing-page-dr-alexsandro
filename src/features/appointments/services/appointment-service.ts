import type {
  Appointment,
  AppointmentQuery,
  AppointmentStatus,
  AppointmentType,
  AvailabilitySlot,
  CreateAppointmentPayload,
  CreateBlockPayload,
  CreateSchedulePayload,
  Doctor,
  DoctorSchedule,
  ScheduleBlock,
} from "@/features/appointments/types/appointment";
import { apiFetch } from "@/lib/api-client";

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}
function array(value: unknown) {
  const container = object(value);
  return Array.isArray(value)
    ? value
    : Array.isArray(container.items)
      ? container.items
      : Array.isArray(container.data)
        ? container.data
        : [];
}
function appointment(value: unknown): Appointment {
  const item = object(value);
  return {
    id: Number(item.id),
    patient_id: Number(item.patient_id),
    ...(item.patient_name ? { patient_name: String(item.patient_name) } : {}),
    doctor_id: Number(item.doctor_id),
    doctor_name: String(item.doctor_name ?? ""),
    type_id: Number(item.type_id),
    ...(item.type_name ? { type_name: String(item.type_name) } : {}),
    start_at: String(item.start_at ?? ""),
    end_at: String(item.end_at ?? ""),
    status: String(item.status) as AppointmentStatus,
    is_fit_in: Boolean(item.is_fit_in),
    created_by: Number(item.created_by),
    created_by_name: String(item.created_by_name ?? ""),
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? ""),
    ...(item.rescheduled_from_id != null
      ? { rescheduled_from_id: Number(item.rescheduled_from_id) }
      : {}),
  };
}
function appointmentType(value: unknown): AppointmentType {
  const item = object(value);
  return {
    id: Number(item.id),
    name: String(item.name ?? ""),
    duration_minutes: Number(item.duration_minutes),
    active: item.active === undefined ? true : Boolean(item.active),
  };
}
function schedule(value: unknown): DoctorSchedule {
  const item = object(value);
  return {
    id: Number(item.id),
    doctor_id: Number(item.doctor_id),
    weekday: Number(item.weekday),
    start_time: String(item.start_time ?? ""),
    end_time: String(item.end_time ?? ""),
    slot_interval_minutes: Number(item.slot_interval_minutes ?? 20),
  };
}
function block(value: unknown): ScheduleBlock {
  const item = object(value);
  return {
    id: Number(item.id),
    doctor_id: Number(item.doctor_id),
    doctor_name: String(item.doctor_name ?? ""),
    start_at: String(item.start_at ?? ""),
    end_at: String(item.end_at ?? ""),
    reason: String(item.reason ?? ""),
    created_by: Number(item.created_by),
    created_by_name: String(item.created_by_name ?? ""),
    ...(item.created_at ? { created_at: String(item.created_at) } : {}),
  };
}
function query(params: Record<string, string | number | undefined>) {
  const result = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") result.set(key, String(value));
  });
  return result.toString();
}

export const appointmentService = {
  async doctors(signal?: AbortSignal) {
    return array(await apiFetch<unknown>("/gateway/doctors", { signal })).map(
      (value): Doctor => {
        const item = object(value);
        return { id: Number(item.id), name: String(item.name ?? "") };
      },
    );
  },
  async types(activeOnly = false, signal?: AbortSignal) {
    return array(
      await apiFetch<unknown>(
        `/gateway/appointment-types?active_only=${activeOnly}`,
        { signal },
      ),
    ).map(appointmentType);
  },
  async createType(payload: { name: string; duration_minutes: number }) {
    return appointmentType(
      await apiFetch<unknown>("/gateway/appointment-types", {
        method: "POST",
        body: JSON.stringify({ ...payload, name: payload.name.trim() }),
      }),
    );
  },
  async updateType(
    id: number,
    payload: { name: string; duration_minutes: number; active: boolean },
  ) {
    return appointmentType(
      await apiFetch<unknown>(`/gateway/appointment-types/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...payload, name: payload.name.trim() }),
      }),
    );
  },
  async appointments(params: AppointmentQuery, signal?: AbortSignal) {
    return array(
      await apiFetch<unknown>(
        `/gateway/appointments?${query({ start_at: params.start_at, end_at: params.end_at, doctor_id: params.doctor_id, status: params.status })}`,
        { signal },
      ),
    ).map(appointment);
  },
  async availability(
    doctorId: number,
    typeId: number,
    date: string,
    signal?: AbortSignal,
  ) {
    return array(
      await apiFetch<unknown>(
        `/gateway/appointments/availability?${query({ doctor_id: doctorId, type_id: typeId, date })}`,
        { signal },
      ),
    ).map((value): AvailabilitySlot => ({
      start_at: String(object(value).start_at ?? ""),
    }));
  },
  async create(payload: CreateAppointmentPayload) {
    return appointment(
      await apiFetch<unknown>("/gateway/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  },
  async transition(
    id: number,
    action: "confirm" | "start" | "finish" | "no-show",
  ) {
    return appointment(
      await apiFetch<unknown>(`/gateway/appointments/${id}/${action}`, {
        method: "POST",
        body: "{}",
      }),
    );
  },
  async cancel(id: number, reason: string) {
    return appointment(
      await apiFetch<unknown>(`/gateway/appointments/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      }),
    );
  },
  async reschedule(
    id: number,
    payload: { start_at: string; reason: string; is_fit_in: boolean },
  ) {
    return appointment(
      await apiFetch<unknown>(`/gateway/appointments/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ ...payload, reason: payload.reason.trim() }),
      }),
    );
  },
  async schedules(doctorId: number, signal?: AbortSignal) {
    return array(
      await apiFetch<unknown>(
        `/gateway/doctor-schedules?doctor_id=${doctorId}`,
        { signal },
      ),
    ).map(schedule);
  },
  async createSchedule(payload: CreateSchedulePayload) {
    return schedule(
      await apiFetch<unknown>("/gateway/doctor-schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  },
  async deleteSchedule(id: number) {
    await apiFetch<void>(`/gateway/doctor-schedules/${id}`, {
      method: "DELETE",
    });
  },
  async blocks(
    doctorId: number,
    startAt: string,
    endAt: string,
    signal?: AbortSignal,
  ) {
    return array(
      await apiFetch<unknown>(
        `/gateway/schedule-blocks?${query({ doctor_id: doctorId, start_at: startAt, end_at: endAt })}`,
        { signal },
      ),
    ).map(block);
  },
  async createBlock(payload: CreateBlockPayload) {
    return block(
      await apiFetch<unknown>("/gateway/schedule-blocks", {
        method: "POST",
        body: JSON.stringify({ ...payload, reason: payload.reason.trim() }),
      }),
    );
  },
  async deleteBlock(id: number) {
    await apiFetch<void>(`/gateway/schedule-blocks/${id}`, {
      method: "DELETE",
    });
  },
};

export const appointmentStatuses = [
  "AGENDADA",
  "CONFIRMADA",
  "EM_ATENDIMENTO",
  "FINALIZADA",
  "REMARCADA",
  "CANCELADA",
  "NAO_COMPARECEU",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

export interface Doctor {
  id: number;
  name: string;
}
export interface AppointmentType {
  id: number;
  name: string;
  duration_minutes: number;
  active: boolean;
}
export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
}
export interface ScheduleBlock {
  id: number;
  doctor_id: number;
  doctor_name: string;
  start_at: string;
  end_at: string;
  reason: string;
  created_by: number;
  created_by_name: string;
  created_at?: string;
}
export interface AvailabilitySlot {
  start_at: string;
}
export interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name: string;
  type_id: number;
  type_name?: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  is_fit_in: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  rescheduled_from_id?: number;
}

export interface AppointmentQuery {
  start_at: string;
  end_at: string;
  doctor_id?: number;
  status?: AppointmentStatus;
}

export interface CreateAppointmentPayload {
  patient_id: number;
  doctor_id: number;
  type_id: number;
  start_at: string;
  is_fit_in: boolean;
}

export interface CreateSchedulePayload {
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes?: number;
}

export interface CreateBlockPayload {
  doctor_id: number;
  start_at: string;
  end_at: string;
  reason: string;
}

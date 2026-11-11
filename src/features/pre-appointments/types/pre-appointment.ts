export interface PublicDoctor {
  id: number;
  name: string;
}

export interface PublicAppointmentType {
  id: number;
  name: string;
  duration_minutes: number;
}

export interface PublicAvailabilitySlot {
  start_at: string;
}

export interface PreAppointmentFormValues {
  full_name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email: string;
  doctor_id: string;
  type_id: string;
  date: string;
  start_at: string;
}

export interface CreatePreAppointmentPayload {
  full_name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email: string;
  doctor_id: number;
  type_id: number;
  start_at: string;
}

export interface PreAppointmentResult {
  id: number;
  status: string;
  end_at?: string;
  cpf_masked?: string;
}

export const preAppointmentStatuses = ["PENDENTE", "APROVADA", "RECUSADA"] as const;
export type PreAppointmentStatus = (typeof preAppointmentStatuses)[number];

export interface AdminPreAppointment {
  id: number;
  full_name: string;
  cpf_masked?: string;
  birth_date: string;
  phone: string;
  email: string;
  doctor_id: number;
  doctor_name: string;
  type_id: number;
  type_name: string;
  start_at: string;
  end_at: string;
  status: PreAppointmentStatus;
  reviewed_by?: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  appointment_id?: number;
}

export interface PreAppointmentList {
  items: AdminPreAppointment[];
  total?: number;
}

export interface AdminPreAppointmentQuery {
  status?: PreAppointmentStatus;
  doctor_id?: number;
  start_at?: string;
  end_at?: string;
  limit: number;
  offset: number;
}

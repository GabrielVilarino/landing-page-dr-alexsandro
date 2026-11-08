export interface PatientGuardian {
  id: number;
  name: string;
  document_masked: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
}

export interface Patient {
  id: number;
  full_name: string;
  cpf_masked: string;
  birth_date: string;
  phone: string;
  email: string;
  guardians: PatientGuardian[];
  version: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface PatientHistoryEntry {
  id: number;
  patient_id: number;
  version: number;
  action: string;
  changed_by: number;
  changed_at: string;
  patient: Partial<Patient>;
}

export interface CreateGuardianPayload {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  relationship?: string;
  is_primary: boolean;
}

export interface UpdateGuardianPayload extends CreateGuardianPayload {
  id?: number;
}

export interface CreatePatientPayload {
  full_name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email: string;
  guardians: CreateGuardianPayload[];
}

export interface UpdatePatientPayload {
  full_name: string;
  cpf?: string;
  birth_date: string;
  phone: string;
  email: string;
  version: number;
  guardians: UpdateGuardianPayload[];
}

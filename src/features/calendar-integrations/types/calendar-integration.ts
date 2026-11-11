export type CalendarIntegrationStatus =
  | "PENDENTE"
  | "ATIVA"
  | "ERRO"
  | "DESCONECTADA";

export interface CalendarIntegration {
  doctor_id: number;
  status: CalendarIntegrationStatus;
  google_account_email?: string;
  calendar_id?: string;
  last_synced_at?: string;
  last_error?: string;
}

export interface GoogleCalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

export interface SelectGoogleCalendarPayload {
  doctor_id: number;
  calendar_id: string;
}

export interface GoogleAuthorization {
  authorization_url: string;
}

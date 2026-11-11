import { calendarSelectionSchema } from "@/features/calendar-integrations/schemas/calendar-integration-schema";
import type {
  CalendarIntegration,
  CalendarIntegrationStatus,
  GoogleAuthorization,
  GoogleCalendarOption,
  SelectGoogleCalendarPayload,
} from "@/features/calendar-integrations/types/calendar-integration";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";

const statuses = new Set<CalendarIntegrationStatus>([
  "PENDENTE",
  "ATIVA",
  "ERRO",
  "DESCONECTADA",
]);

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): unknown[] {
  const container = object(value);
  if (Array.isArray(value)) return value;
  if (Array.isArray(container.items)) return container.items;
  if (Array.isArray(container.data)) return container.data;
  return [];
}

function optionalString(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function safeOperationalError(value: unknown) {
  const message = optionalString(value)?.replace(/[\r\n\t]+/g, " ");
  return message ? message.slice(0, 240) : undefined;
}

function connection(value: unknown): CalendarIntegration {
  const item = object(value);
  const rawStatus = String(item.status ?? "");
  const status = statuses.has(rawStatus as CalendarIntegrationStatus)
    ? (rawStatus as CalendarIntegrationStatus)
    : "ERRO";

  return {
    doctor_id: Number(item.doctor_id),
    status,
    ...(optionalString(item.google_account_email)
      ? { google_account_email: optionalString(item.google_account_email) }
      : {}),
    ...(optionalString(item.calendar_id)
      ? { calendar_id: optionalString(item.calendar_id) }
      : {}),
    ...(optionalString(item.last_synced_at)
      ? { last_synced_at: optionalString(item.last_synced_at) }
      : {}),
    ...(safeOperationalError(item.last_error)
      ? { last_error: safeOperationalError(item.last_error) }
      : status === "ERRO" && !statuses.has(rawStatus as CalendarIntegrationStatus)
        ? { last_error: "A integração retornou um estado inesperado." }
        : {}),
  };
}

function calendar(value: unknown): GoogleCalendarOption {
  const item = object(value);
  return {
    id: String(item.id ?? "").trim(),
    summary: String(item.summary ?? "Calendário sem nome").trim(),
    primary: Boolean(item.primary),
  };
}

function doctorQuery(doctorId: number) {
  const params = new URLSearchParams({ doctor_id: String(doctorId) });
  return params.toString();
}

export const calendarIntegrationService = {
  async getConnection(doctorId: number, signal?: AbortSignal) {
    try {
      const value = await apiFetch<unknown>(
        `/gateway/calendar-integrations/google?${doctorQuery(doctorId)}`,
        { signal },
      );
      return connection(value);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async authorize(doctorId: number) {
    const item = object(
      await apiFetch<unknown>(
        `/gateway/calendar-integrations/google/authorize?${doctorQuery(doctorId)}`,
        { method: "POST", body: "{}" },
      ),
    );
    const authorizationUrl = String(item.authorization_url ?? "").trim();
    const parsedUrl = new URL(authorizationUrl);
    if (parsedUrl.protocol !== "https:") {
      throw new Error("A URL de autorização recebida é inválida.");
    }
    return { authorization_url: authorizationUrl } satisfies GoogleAuthorization;
  },

  async calendars(doctorId: number, signal?: AbortSignal) {
    const value = await apiFetch<unknown>(
      `/gateway/calendar-integrations/google/calendars?${doctorQuery(doctorId)}`,
      { signal },
    );
    return array(value)
      .map(calendar)
      .filter((item) => item.id && item.summary);
  },

  async selectCalendar(payload: SelectGoogleCalendarPayload) {
    const normalized = calendarSelectionSchema.parse(payload);
    await apiFetch<void>("/gateway/calendar-integrations/google/calendar", {
      method: "PUT",
      body: JSON.stringify(normalized),
    });
  },

  async disconnect(doctorId: number) {
    await apiFetch<void>(
      `/gateway/calendar-integrations/google?${doctorQuery(doctorId)}`,
      { method: "DELETE" },
    );
  },

  async retry(doctorId: number) {
    await apiFetch<void>(
      `/gateway/calendar-integrations/google/retry?${doctorQuery(doctorId)}`,
      { method: "POST", body: "{}" },
    );
  },
};

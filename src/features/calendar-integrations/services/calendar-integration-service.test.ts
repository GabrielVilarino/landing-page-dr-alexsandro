import { afterEach, describe, expect, mock, test } from "bun:test";

import { calendarIntegrationService } from "@/features/calendar-integrations/services/calendar-integration-service";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function useFetch(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Response,
) {
  const fetchMock = mock(implementation);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("calendarIntegrationService", () => {
  test("normaliza o estado sanitizado da conexão", async () => {
    useFetch(() =>
      Response.json({
        doctor_id: "2",
        google_account_email: " medico@exemplo.com ",
        calendar_id: "calendar-id",
        status: "ERRO",
        last_synced_at: "2026-11-11T08:20:00-03:00",
        last_error: " Falha temporária\nno provedor ",
      }),
    );

    await expect(calendarIntegrationService.getConnection(2)).resolves.toEqual(
      {
        doctor_id: 2,
        google_account_email: "medico@exemplo.com",
        calendar_id: "calendar-id",
        status: "ERRO",
        last_synced_at: "2026-11-11T08:20:00-03:00",
        last_error: "Falha temporária no provedor",
      },
    );
  });

  test("converte 404 do estado em ausência de conexão", async () => {
    useFetch(() =>
      Response.json({ error: "Integração não encontrada." }, { status: 404 }),
    );

    await expect(calendarIntegrationService.getConnection(7)).resolves.toBeNull();
  });

  test("usa os caminhos, métodos e payloads do contrato", async () => {
    const fetchMock = useFetch((input) => {
      const url = String(input);
      if (url.includes("/authorize")) {
        return Response.json({
          authorization_url: "https://accounts.google.com/o/oauth2/v2/auth",
        });
      }
      if (url.includes("/calendars")) {
        return Response.json([
          { id: " calendar-id ", summary: " Consultório ", primary: true },
        ]);
      }
      return new Response(null, { status: 204 });
    });

    await expect(calendarIntegrationService.authorize(2)).resolves.toEqual({
      authorization_url: "https://accounts.google.com/o/oauth2/v2/auth",
    });
    await expect(calendarIntegrationService.calendars(2)).resolves.toEqual([
      { id: "calendar-id", summary: "Consultório", primary: true },
    ]);
    await calendarIntegrationService.selectCalendar({
      doctor_id: 2,
      calendar_id: " calendar-id ",
    });
    await calendarIntegrationService.disconnect(2);
    await calendarIntegrationService.retry(2);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/gateway/calendar-integrations/google/authorize?doctor_id=2",
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: "{}",
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/gateway/calendar-integrations/google/calendars?doctor_id=2",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "/api/gateway/calendar-integrations/google/calendar",
    );
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ doctor_id: 2, calendar_id: "calendar-id" }),
    });
    expect(fetchMock.mock.calls[3]?.[0]).toBe(
      "/api/gateway/calendar-integrations/google?doctor_id=2",
    );
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({ method: "DELETE" });
    expect(fetchMock.mock.calls[4]?.[0]).toBe(
      "/api/gateway/calendar-integrations/google/retry?doctor_id=2",
    );
    expect(fetchMock.mock.calls[4]?.[1]).toMatchObject({
      method: "POST",
      body: "{}",
    });
  });
});

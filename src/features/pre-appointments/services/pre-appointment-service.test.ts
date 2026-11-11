import { describe, expect, test } from "bun:test";
import { preAppointmentService } from "./pre-appointment-service";

describe("serviço de pré-agendamento", () => {
  test("normaliza CPF e telefone no envio público", async () => {
    const originalFetch = globalThis.fetch;
    let request: Request | undefined;
    globalThis.fetch = (async (input, init) => {
      request = new Request(new URL(String(input), "http://localhost"), init);
      return new Response(JSON.stringify({ id: 7, status: "PENDENTE" }), { status: 201, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      await preAppointmentService.create({ full_name: " Maria ", cpf: "529.982.247-25", birth_date: "1990-01-02", phone: " (63) 99999-9999 ", email: " maria@exemplo.com ", doctor_id: 2, type_id: 1, start_at: "2026-11-12T09:00:00-03:00" });
      expect(request?.url).toContain("/api/backend/public/pre-appointments");
      expect(await request?.json()).toMatchObject({ cpf: "52998224725", phone: "(63) 99999-9999", email: "maria@exemplo.com", full_name: "Maria" });
    } finally { globalThis.fetch = originalFetch; }
  });

  test("adapta a fila administrativa no formato items/data", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: [{ id: 9, full_name: "Maria", birth_date: "1990-01-02", phone: "999", email: "maria@exemplo.com", doctor_id: 2, doctor_name: "Dr. Alessandro", type_id: 1, type_name: "Primeira consulta", start_at: "2026-11-12T09:00:00-03:00", end_at: "2026-11-12T10:00:00-03:00", status: "PENDENTE" }], total: 1 }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    try {
      const response = await preAppointmentService.list({ status: "PENDENTE", limit: 50, offset: 0 });
      expect(response.items[0]?.full_name).toBe("Maria");
      expect(response.total).toBe(1);
    } finally { globalThis.fetch = originalFetch; }
  });
});

import { afterEach, describe, expect, it } from "bun:test";

import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("apiFetch", () => {
  it("não expõe mensagem nem payload de respostas 5xx", async () => {
    globalThis.fetch = Object.assign(
      async () =>
        new Response(
          JSON.stringify({ error: "detalhe interno sensível", stack: "trace" }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
      { preconnect: originalFetch.preconnect },
    );

    try {
      await apiFetch("/teste");
      throw new Error("Era esperado um ApiError.");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe(
        "Não foi possível concluir a operação. Tente novamente.",
      );
      expect((error as ApiError).details).toBeUndefined();
    }
  });

  it("coordena um único refresh para requisições concorrentes", async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;
    globalThis.fetch = Object.assign(
      async (input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/api/session/refresh")) {
          refreshCalls += 1;
          return new Response(null, { status: 204 });
        }
        protectedCalls += 1;
        if (protectedCalls <= 2) {
          return new Response(null, {
            status: 401,
            headers: { "x-session-version": "versao-antiga" },
          });
        }
        return Response.json({ ok: true });
      },
      { preconnect: originalFetch.preconnect },
    );

    const [first, second] = await Promise.all([
      apiFetch<{ ok: boolean }>("/protegido"),
      apiFetch<{ ok: boolean }>("/protegido"),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });
});

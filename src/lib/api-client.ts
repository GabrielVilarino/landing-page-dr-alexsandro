import { ApiError } from "@/lib/api-error";

const API_PREFIX = "/api";
let refreshPromise: Promise<void> | null = null;

async function refreshSession(failedVersion: string | null) {
  if (refreshPromise) return refreshPromise;

  const execute = async () => {
    const headers = new Headers();
    if (failedVersion) headers.set("x-session-version", failedVersion);
    const response = await fetch(`${API_PREFIX}/session/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new ApiError(
        "Sua sessão expirou. Entre novamente.",
        response.status,
      );
    }
  };

  const operation =
    typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request<void>("rf01-session-refresh", async () => {
          await execute();
        })
      : execute();

  refreshPromise = operation.finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const perform = () =>
    fetch(`${API_PREFIX}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });

  let response = await perform();
  let attemptedRefresh = false;
  const canRefresh = ![
    "/session/login",
    "/session/logout",
    "/session/refresh",
  ].includes(path) && !path.startsWith("/backend/public/");
  if (response.status === 401 && canRefresh) {
    try {
      attemptedRefresh = true;
      await refreshSession(response.headers.get("x-session-version"));
      response = await perform();
    } catch {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session:expired"));
      }
    }
  }

  if (
    response.status === 401 &&
    attemptedRefresh &&
    typeof window !== "undefined"
  ) {
    await fetch(`${API_PREFIX}/session/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).catch(() => undefined);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload =
    response.status === 204
      ? undefined
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    const message =
      response.status >= 500
        ? "Não foi possível concluir a operação. Tente novamente."
        : typeof payload === "object" && payload && "error" in payload
          ? String(payload.error)
          : "A operação não pôde ser concluída.";

    if (
      typeof window !== "undefined" &&
      response.status === 401 &&
      path !== "/session/login"
    ) {
      window.dispatchEvent(new Event("session:expired"));
    }
    if (typeof window !== "undefined" && response.status === 403) {
      window.dispatchEvent(new Event("session:forbidden"));
    }

    throw new ApiError(
      message,
      response.status,
      response.status >= 500 ? undefined : payload,
    );
  }

  return payload as T;
}

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_EXPIRES_COOKIE,
  MUST_CHANGE_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/session/constants";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

interface BackendError {
  error?: string;
}

interface RefreshCycle {
  promise: Promise<TokenPair>;
  expiresAt: number;
}

const refreshes = new Map<string, RefreshCycle>();

function backendBaseUrl() {
  const value = process.env.BACKEND_API_URL?.replace(/\/$/, "");
  if (!value) throw new Error("BACKEND_API_URL não está configurada.");
  return `${value}/api/v1`;
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${backendBaseUrl()}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as BackendError;
  return payload.error || "Não foi possível concluir a operação.";
}

export async function readTokenPair(response: Response) {
  if (!response.ok) {
    throw new Response(await readError(response), { status: response.status });
  }
  return (await response.json()) as TokenPair;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...cookieBase,
    expires: new Date(tokens.access_expires_at),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...cookieBase,
    expires: new Date(tokens.refresh_expires_at),
  });
  response.cookies.set(ACCESS_EXPIRES_COOKIE, tokens.access_expires_at, {
    ...cookieBase,
    expires: new Date(tokens.refresh_expires_at),
  });
}

export function setMustChangeCookie(response: NextResponse, value: boolean) {
  response.cookies.set(MUST_CHANGE_COOKIE, value ? "1" : "0", {
    ...cookieBase,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    ACCESS_EXPIRES_COOKIE,
    MUST_CHANGE_COOKIE,
  ]) {
    response.cookies.set(name, "", { ...cookieBase, maxAge: 0 });
  }
}

function accessVersion(accessToken: string) {
  return createHash("sha256")
    .update(accessToken)
    .digest("base64url")
    .slice(0, 22);
}

async function refreshTokens(refreshToken: string) {
  const key = createHash("sha256").update(refreshToken).digest("hex");
  const existing = refreshes.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;

  const operation = (async () => {
    return backendFetch("auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).then(readTokenPair);
  })();

  refreshes.set(key, { promise: operation, expiresAt: Date.now() + 10_000 });
  setTimeout(() => {
    const current = refreshes.get(key);
    if (current?.promise === operation) refreshes.delete(key);
  }, 10_000);
  try {
    return await operation;
  } catch (error) {
    refreshes.delete(key);
    throw error;
  }
}

function proxyResponse(backendResponse: Response) {
  const headers = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}

export function hasValidOrigin(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function authenticatedBackendRequest(
  request: NextRequest,
  path: string,
  init: RequestInit,
) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  const call = (token: string) =>
    backendFetch(path, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init.headers)),
        Authorization: `Bearer ${token}`,
      },
    });

  const backendResponse = accessToken
    ? await call(accessToken)
    : new Response(null, { status: 401 });

  const response = proxyResponse(backendResponse);
  if (accessToken)
    response.headers.set("x-session-version", accessVersion(accessToken));
  return response;
}

export async function refreshSessionRequest(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const failedVersion = request.headers.get("x-session-version");

  if (
    accessToken &&
    failedVersion &&
    accessVersion(accessToken) !== failedVersion
  ) {
    return new NextResponse(null, { status: 204 });
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json(
      { error: "Sua sessão expirou. Entre novamente." },
      { status: 401 },
    );
    clearSessionCookies(response);
    return response;
  }

  let tokens: TokenPair;
  try {
    tokens = await refreshTokens(refreshToken);
  } catch {
    const response = NextResponse.json(
      { error: "Sua sessão expirou. Entre novamente." },
      { status: 401 },
    );
    clearSessionCookies(response);
    return response;
  }

  let mustChangePassword: boolean | undefined;
  try {
    const meResponse = await backendFetch("me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meResponse.ok) throw new Error("Falha ao validar a sessão renovada.");
    const me = (await meResponse.json()) as { must_change_password?: boolean };
    mustChangePassword = Boolean(me.must_change_password);
  } catch {
    const response = new NextResponse(null, {
      status: 202,
      headers: { "x-session-validation": "pending" },
    });
    setSessionCookies(response, tokens);
    return response;
  }

  const response = new NextResponse(null, { status: 204 });
  setSessionCookies(response, tokens);
  setMustChangeCookie(response, mustChangePassword);
  return response;
}

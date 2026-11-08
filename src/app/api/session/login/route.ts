import { NextRequest, NextResponse } from "next/server";

import {
  backendFetch,
  hasValidOrigin,
  readTokenPair,
  setMustChangeCookie,
  setSessionCookies,
} from "@/lib/session/backend";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição inválida." },
      { status: 403 },
    );
  }

  const body = await request.text();
  const loginResponse = await backendFetch("auth/login", {
    method: "POST",
    body,
  });

  let tokens;
  try {
    tokens = await readTokenPair(loginResponse);
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: await error.text() },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível entrar. Tente novamente." },
      { status: 500 },
    );
  }

  const meResponse = await backendFetch("me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!meResponse.ok) {
    return NextResponse.json(
      { error: "Não foi possível carregar os dados da conta." },
      { status: meResponse.status },
    );
  }

  const me = (await meResponse.json()) as { must_change_password?: boolean };
  const response = NextResponse.json(me);
  setSessionCookies(response, tokens);
  setMustChangeCookie(response, Boolean(me.must_change_password));
  return response;
}

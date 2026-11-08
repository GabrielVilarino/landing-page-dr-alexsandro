import { NextRequest, NextResponse } from "next/server";

import {
  authenticatedBackendRequest,
  clearSessionCookies,
  hasValidOrigin,
} from "@/lib/session/backend";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição inválida." },
      { status: 403 },
    );
  }

  try {
    await authenticatedBackendRequest(request, "auth/logout", {
      method: "POST",
    });
  } catch {
    // A sessão local deve ser descartada mesmo quando o backend estiver indisponível.
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}

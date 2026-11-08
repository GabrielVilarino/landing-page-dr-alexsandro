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

  const response = await authenticatedBackendRequest(
    request,
    "auth/change-password",
    {
      method: "POST",
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    },
  );

  if (response.ok) clearSessionCookies(response);
  return response;
}

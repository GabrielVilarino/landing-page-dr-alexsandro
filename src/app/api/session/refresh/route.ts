import { NextRequest, NextResponse } from "next/server";

import { hasValidOrigin, refreshSessionRequest } from "@/lib/session/backend";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição inválida." },
      { status: 403 },
    );
  }
  return refreshSessionRequest(request);
}

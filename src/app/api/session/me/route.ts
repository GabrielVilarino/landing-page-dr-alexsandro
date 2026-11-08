import { NextRequest, NextResponse } from "next/server";

import {
  authenticatedBackendRequest,
  setMustChangeCookie,
} from "@/lib/session/backend";

export async function GET(request: NextRequest) {
  const backendResponse = await authenticatedBackendRequest(request, "me", {
    method: "GET",
  });
  if (!backendResponse.ok) return backendResponse;

  const me = (await backendResponse.json()) as {
    must_change_password?: boolean;
  };
  const response = NextResponse.json(me);
  for (const cookie of backendResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  setMustChangeCookie(response, Boolean(me.must_change_password));
  return response;
}

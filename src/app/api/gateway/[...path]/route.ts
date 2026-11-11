import { NextRequest, NextResponse } from "next/server";

import {
  authenticatedBackendRequest,
  hasValidOrigin,
} from "@/lib/session/backend";

type RouteContext = { params: Promise<{ path: string[] }> };

const allowedPaths = [
  /^admin\/users(?:\/\d+(?:\/(?:active|roles|reset-password))?)?$/,
  /^admin\/roles(?:\/\d+(?:\/permissions)?)?$/,
  /^admin\/permissions$/,
  /^patients(?:\/\d+(?:\/history)?)?$/,
  /^doctors$/,
  /^appointment-types(?:\/\d+)?$/,
  /^doctor-schedules(?:\/\d+)?$/,
  /^schedule-blocks(?:\/\d+)?$/,
  /^calendar-integrations\/google$/,
  /^calendar-integrations\/google\/authorize$/,
  /^calendar-integrations\/google\/calendars$/,
  /^calendar-integrations\/google\/calendar$/,
  /^calendar-integrations\/google\/retry$/,
  /^pre-appointments(?:\/\d+\/(?:approve|reject))?$/,
  /^appointments(?:\/availability|\/\d+\/(?:confirm|start|finish|no-show|cancel|reschedule))?$/,
];

async function handle(request: NextRequest, context: RouteContext) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição inválida." },
      { status: 403 },
    );
  }

  const { path } = await context.params;
  const joinedPath = path.join("/");
  if (!allowedPaths.some((pattern) => pattern.test(joinedPath))) {
    return NextResponse.json({ error: "Rota não permitida." }, { status: 404 });
  }

  const search = request.nextUrl.search;
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();
  return authenticatedBackendRequest(request, `${joinedPath}${search}`, {
    method: request.method,
    body: body || undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

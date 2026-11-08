import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  MUST_CHANGE_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/session/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  const mustChangePassword =
    request.cookies.get(MUST_CHANGE_COOKIE)?.value === "1";
  const isLogin = pathname === "/admin/login";
  const isChangePassword = pathname === "/admin/trocar-senha";

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (hasSession && isLogin) {
    return NextResponse.redirect(
      new URL(
        mustChangePassword ? "/admin/trocar-senha" : "/admin",
        request.url,
      ),
    );
  }

  if (hasSession && mustChangePassword && !isChangePassword) {
    return NextResponse.redirect(new URL("/admin/trocar-senha", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

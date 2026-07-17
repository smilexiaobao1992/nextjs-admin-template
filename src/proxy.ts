import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight proxy: only forwards the request path so server layouts
 * can preserve deep links when redirecting unauthenticated users to /login.
 * Authorization still happens in server layouts and Server Actions.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-pathname", path);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

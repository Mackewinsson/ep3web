import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  homePathForRole,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth/session";

const DRIVER_ALLOWED_PREFIXES = ["/panel/mis-trabajos"];

function isDriverAllowedPath(pathname: string) {
  return DRIVER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPanel = pathname.startsWith("/panel");
  const isSignIn = pathname.startsWith("/sign-in");

  if (!isPanel && !isSignIn) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isPanel && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isSignIn && session) {
    const url = request.nextUrl.clone();
    url.pathname = homePathForRole(session.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPanel && session?.role === "driver" && !isDriverAllowedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel/mis-trabajos";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    isPanel &&
    session?.role === "admin" &&
    pathname.startsWith("/panel/mis-trabajos")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel/trabajos";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/sign-in"],
};

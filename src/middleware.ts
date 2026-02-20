import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "idris_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/panel/login") || pathname.startsWith("/api/auth")) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }
  if (pathname.startsWith("/panel")) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const login = new URL("/panel/login", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};

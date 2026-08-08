import { NextResponse } from "next/server";
import { WORK_AUTH_COOKIE, WORK_AUTH_VALUE } from "@/lib/work-auth";

// Gates everything under /work behind the password page. The login route
// itself has to be excluded or it would redirect to itself forever.
export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/work/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(WORK_AUTH_COOKIE);
  if (cookie?.value === WORK_AUTH_VALUE) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/work/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/work", "/work/:path*"],
};

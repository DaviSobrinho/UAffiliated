import { NextRequest, NextResponse } from "next/server";

const SLOW_THRESHOLD_MS = 1000;

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, searchParams } = request.nextUrl;

  // Log incoming request
  console.log(`[REQUEST] ${request.method} ${pathname}`);

  const response = NextResponse.next();

  const duration = Date.now() - startTime;

  // Log response with duration
  if (duration > SLOW_THRESHOLD_MS) {
    console.warn(`⚠️  [SLOW] ${request.method} ${pathname} - ${duration}ms`);
  } else {
    console.log(`[RESPONSE] ${request.method} ${pathname} - ${duration}ms`);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

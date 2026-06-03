import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    )
    response.headers.set("Pragma", "no-cache")
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*"],
}

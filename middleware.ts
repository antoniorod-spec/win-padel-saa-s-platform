import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes: Record<string, string[]> = {
  "/jugador": ["PLAYER"],
  "/club": ["CLUB"],
  "/admin": ["ADMIN"],
}

const authRoutes = ["/login", "/registro"]

export function middleware(request: NextRequest) {
  const { nextUrl } = request

  // Check for session token (NextAuth sets this cookie)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value

  const isLoggedIn = !!sessionToken

  // Check if the current path is an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname.startsWith(route))

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Check protected routes
  for (const [route] of Object.entries(protectedRoutes)) {
    if (nextUrl.pathname.startsWith(route)) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl))
      }
      // Note: Role-based protection is handled at the page/API level
      // since we can't decode JWT in Edge middleware without crypto
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/jugador/:path*",
    "/club/:path*",
    "/admin/:path*",
    "/login",
    "/registro",
  ],
}

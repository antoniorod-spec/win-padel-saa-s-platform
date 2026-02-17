import createMiddleware from "next-intl/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { routing } from "./i18n/routing"

// Important: keep Spanish at `/` regardless of browser language.
// If localeDetection is enabled, visiting `/` with an English browser gets redirected to `/en`.
const intlMiddleware = createMiddleware({ ...routing, localeDetection: false })

function startsWithSegment(pathname: string, segment: string) {
  return pathname === segment || pathname.startsWith(`${segment}/`)
}

function getLocaleFromPathname(pathname: string) {
  const match = pathname.match(/^\/(es|en)(?=\/|$)/)
  return (match?.[1] ?? routing.defaultLocale) as (typeof routing.locales)[number]
}

function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/"
}

function localizeInternalPathname(locale: string, internal: keyof typeof routing.pathnames) {
  const entry = routing.pathnames[internal]
  const localized = typeof entry === "string" ? entry : entry[locale as "es" | "en"]
  // localePrefix: 'as-needed' -> default locale has no prefix.
  if (locale === routing.defaultLocale) return localized
  if (localized === "/") return `/${locale}`
  return `/${locale}${localized}`
}

const protectedRoutes = [
  // PLAYER
  "/jugador",
  "/player",
  // CLUB
  "/club",
  // ADMIN
  "/admin",
]

const authRoutes = [
  "/login",
  "/registro",
  "/sign-in",
  "/sign-up",
]

export default function middleware(request: NextRequest) {
  // If someone hits /es/*, canonicalize to no-prefix Spanish URLs.
  // This prevents bugs like /es/es and avoids duplicate content.
  if (request.nextUrl.pathname === "/es" || request.nextUrl.pathname.startsWith("/es/")) {
    const nextUrl = request.nextUrl
    const stripped = stripLocalePrefix(nextUrl.pathname)
    const target = new URL(`${stripped}${nextUrl.search}`, nextUrl)
    return NextResponse.redirect(target)
  }

  // First, let next-intl handle:
  // - locale detection/prefixing (only /en/* for non-default)
  // - rewriting localized pathnames (/en/tournaments -> internal /torneos, etc.)
  const response = intlMiddleware(request)

  const { nextUrl } = request
  const locale = getLocaleFromPathname(nextUrl.pathname)
  const pathnameNoLocale = stripLocalePrefix(nextUrl.pathname)

  // Check for session token (NextAuth sets this cookie).
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value
  const isLoggedIn = !!sessionToken

  const isAuthRoute = authRoutes.some((route) => startsWithSegment(pathnameNoLocale, route))
  const isProtectedRoute = protectedRoutes.some((route) => startsWithSegment(pathnameNoLocale, route))

  // Redirect logged-in users away from auth pages.
  if (isAuthRoute && isLoggedIn) {
    // Redirect to the localized home.
    const home = locale === routing.defaultLocale ? "/" : `/${locale}`
    return NextResponse.redirect(new URL(home, nextUrl))
  }

  // Redirect anonymous users into localized sign-in.
  if (isProtectedRoute && !isLoggedIn) {
    const loginPath = localizeInternalPathname(locale, "/login")
    return NextResponse.redirect(new URL(loginPath, nextUrl))
  }

  return response
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Next.js internals
  // - static files (containing a dot)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}

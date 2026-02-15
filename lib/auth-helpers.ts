import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"

/**
 * Get the current authenticated session or return an error response.
 * Use in API routes to enforce authentication.
 */
export async function getAuthSession() {
  const session = await auth()
  return session
}

/**
 * Require authentication and specific role(s).
 * Returns the session if authorized, or a NextResponse error.
 */
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth()

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      ),
    }
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      ),
    }
  }

  return { session, error: null }
}

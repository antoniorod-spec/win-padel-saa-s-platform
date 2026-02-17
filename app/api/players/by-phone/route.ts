import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { findPlayerByPhone } from "@/lib/services/imported-roster-service"

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN", "PLAYER"])
    if (error) return error

    const { searchParams } = request.nextUrl
    const phone = searchParams.get("phone") || ""
    if (!phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Teléfono requerido" },
        { status: 400 }
      )
    }

    const player = await findPlayerByPhone(phone)
    if (!player) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "No se encontró jugador con ese teléfono.",
      })
    }

    return NextResponse.json({
      success: true,
      data: player,
    })
  } catch (error) {
    console.error("Error searching player by phone:", error)
    return NextResponse.json(
      { success: false, error: "Error al buscar jugador" },
      { status: 500 }
    )
  }
}

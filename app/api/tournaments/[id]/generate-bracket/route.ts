import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { generateBracket } from "@/lib/services/tournament-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const { modalityId } = body

    if (!modalityId) {
      return NextResponse.json(
        { success: false, error: "Se requiere modalityId" },
        { status: 400 }
      )
    }

    const result = await generateBracket(id, modalityId, session!.user.id)

    return NextResponse.json({
      success: true,
      data: result,
      message: "Bracket generado exitosamente",
    })
  } catch (error) {
    console.error("Error generating bracket:", error)
    const message = error instanceof Error ? error.message : "Error al generar bracket"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

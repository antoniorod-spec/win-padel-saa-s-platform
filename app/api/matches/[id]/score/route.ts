import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { updateScoreSchema } from "@/lib/validations/match"
import { processMatchResult } from "@/lib/services/ranking-service"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const parsed = updateScoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify the match exists and the user has permission
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournamentModality: {
          include: {
            tournament: { include: { club: true } },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Partido no encontrado" },
        { status: 404 }
      )
    }

    if (
      match.tournamentModality.tournament.club.userId !== session!.user.id &&
      session!.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { success: false, error: "No autorizado para registrar resultados en este torneo" },
        { status: 403 }
      )
    }

    const { winner, scores, playedAt } = parsed.data

    const updated = await prisma.match.update({
      where: { id },
      data: {
        winner,
        scores,
        playedAt: playedAt ? new Date(playedAt) : new Date(),
      },
    })

    // Process ranking updates
    await processMatchResult(updated.id)

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Resultado registrado y ranking actualizado",
    })
  } catch (error) {
    console.error("Error updating score:", error)
    return NextResponse.json(
      { success: false, error: "Error al registrar resultado" },
      { status: 500 }
    )
  }
}

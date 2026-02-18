import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const rows = body.rows as Array<{ player1Id: string; player2Id: string; tournamentModalityId: string }>

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: "Se requieren filas válidas" }, { status: 400 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true, modalities: true },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    if (tournament.status !== "DRAFT" && tournament.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: "El torneo no acepta inscripciones en este estado" },
        { status: 400 }
      )
    }

    // Un jugador no puede estar en más de una pareja EN LA MISMA categoría
    const playerModalityToRows = new Map<string, number[]>()
    for (let i = 0; i < rows.length; i++) {
      const { player1Id, player2Id, tournamentModalityId } = rows[i]
      if (player1Id && tournamentModalityId) {
        const key = `${player1Id}::${tournamentModalityId}`
        const list = playerModalityToRows.get(key) ?? []
        list.push(i + 1)
        playerModalityToRows.set(key, list)
      }
      if (player2Id && player2Id !== player1Id && tournamentModalityId) {
        const key = `${player2Id}::${tournamentModalityId}`
        const list = playerModalityToRows.get(key) ?? []
        list.push(i + 1)
        playerModalityToRows.set(key, list)
      }
    }
    for (const [, indices] of playerModalityToRows) {
      if (indices.length > 1) {
        return NextResponse.json(
          {
            success: false,
            error: `Jugador duplicado en la misma categoría: un jugador no puede tener dos parejas en la misma categoría. Revisa las filas ${indices.join(", ")}.`,
          },
          { status: 400 }
        )
      }
    }

    let imported = 0
    const errors: string[] = []

    for (const row of rows) {
      const { player1Id, player2Id, tournamentModalityId } = row
      if (!player1Id || !player2Id || !tournamentModalityId) {
        errors.push(`Fila inválida: datos incompletos`)
        continue
      }

      const modality = tournament.modalities.find((m) => m.id === tournamentModalityId)
      if (!modality || modality.tournamentId !== id) {
        errors.push(`Modalidad ${tournamentModalityId} no válida para este torneo`)
        continue
      }

      if (player1Id === player2Id) {
        errors.push(`Los jugadores deben ser diferentes`)
        continue
      }

      const regCount = await prisma.tournamentRegistration.count({
        where: { tournamentModalityId },
      })
      const maxAllowed = modality.maxPairs ?? tournament.maxTeams
      if (regCount >= maxAllowed) {
        errors.push(`Categoría ${modality.category} ${modality.modality} está llena`)
        continue
      }

      const existing = await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentModalityId,
          OR: [
            { player1Id, player2Id },
            { player1Id: player2Id, player2Id: player1Id },
          ],
        },
      })
      if (existing) {
        continue // Ya inscrita, no contar como error
      }

      const playerAlreadyInCategory = await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentModalityId,
          OR: [{ player1Id }, { player2Id }],
        },
      })
      if (playerAlreadyInCategory) {
        errors.push(
          `Un jugador de esta pareja ya está inscrito en ${modality.category} ${modality.modality} con otra pareja`
        )
        continue
      }

      await prisma.tournamentRegistration.create({
        data: {
          tournamentModalityId,
          player1Id,
          player2Id,
          paymentAmount: tournament.inscriptionPrice,
          paymentStatus: "CONFIRMED",
        },
      })
      imported++
    }

    return NextResponse.json({
      success: true,
      data: {
        importedRows: imported,
        totalRows: rows.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (err) {
    console.error("Import confirmed error:", err)
    return NextResponse.json(
      { success: false, error: "Error al importar parejas" },
      { status: 500 }
    )
  }
}

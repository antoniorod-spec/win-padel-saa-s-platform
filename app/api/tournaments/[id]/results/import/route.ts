import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { parseSpreadsheet } from "@/lib/utils/file-parser"

function pick(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim() !== "") return value.trim()
  }
  return ""
}

function normalizeStage(raw: string) {
  const value = raw.toUpperCase().replace(/\s+/g, "_")
  const map: Record<string, string> = {
    CAMPEON: "CHAMPION",
    CHAMPION: "CHAMPION",
    SUBCAMPEON: "RUNNER_UP",
    RUNNER_UP: "RUNNER_UP",
    SEMIFINAL: "SEMIFINAL",
    SEMIFINALIST: "SEMIFINAL",
    CUARTOS: "QUARTERFINAL",
    QUARTERFINAL: "QUARTERFINAL",
    OCTAVOS: "ROUND_OF_16",
    ROUND_OF_16: "ROUND_OF_16",
    DIECISEISAVOS: "ROUND_OF_32",
    ROUND_OF_32: "ROUND_OF_32",
    GRUPOS: "GROUP_STAGE",
    GROUP_STAGE: "GROUP_STAGE",
  }
  return map[value]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 })
    }

    const rows = await parseSpreadsheet(file)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "El archivo no contiene filas" }, { status: 400 })
    }

    const parsedRows = rows.map((row) => {
      const modality = pick(row, ["modality", "modalidad"]).toUpperCase()
      const category = pick(row, ["category", "categoria"])
      const finalStage = normalizeStage(pick(row, ["final_stage", "etapa", "stage"]))
      const player1Id = pick(row, ["player1_id", "jugador1_id"])
      const player2Id = pick(row, ["player2_id", "jugador2_id"])
      const importedPlayer1Name = pick(row, ["player1_name", "jugador1_nombre", "pareja_1"])
      const importedPlayer2Name = pick(row, ["player2_name", "jugador2_nombre", "pareja_2"])
      return {
        modality,
        category,
        finalStage,
        player1Id,
        player2Id,
        importedPlayer1Name,
        importedPlayer2Name,
      }
    }).filter((row) => row.modality && row.category && row.finalStage)

    if (parsedRows.length === 0) {
      return NextResponse.json({ success: false, error: "No se pudieron interpretar filas validas" }, { status: 400 })
    }

    const submission = await prisma.tournamentResultSubmission.create({
      data: {
        tournamentId: id,
        submittedByUserId: session!.user.id,
        submissionType: "EXCEL",
        fileName: file.name,
        status: "PENDING_REVIEW",
        rows: {
          create: parsedRows.map((row) => ({
            tournamentId: id,
            modality: row.modality as "VARONIL" | "FEMENIL" | "MIXTO",
            category: row.category,
            finalStage: row.finalStage as "CHAMPION" | "RUNNER_UP" | "SEMIFINAL" | "QUARTERFINAL" | "ROUND_OF_16" | "ROUND_OF_32" | "GROUP_STAGE",
            player1Id: row.player1Id || undefined,
            player2Id: row.player2Id || undefined,
            importedPlayer1Name: row.importedPlayer1Name || undefined,
            importedPlayer2Name: row.importedPlayer2Name || undefined,
            sourceClubId: tournament.clubId,
          })),
        },
      },
      include: { rows: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        totalRows: rows.length,
        importedRows: submission.rows.length,
      },
    })
  } catch (err) {
    console.error("Error importing tournament results:", err)
    return NextResponse.json({ success: false, error: "Error al importar resultados" }, { status: 500 })
  }
}

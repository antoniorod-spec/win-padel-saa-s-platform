import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { manualResultsSubmissionSchema } from "@/lib/validations/tournament-results"

function validateStageConsistency(rows: Array<{ modality: string; category: string; finalStage: string }>) {
  const grouped = new Map<string, Array<string>>()
  for (const row of rows) {
    const key = `${row.modality}::${row.category}`
    const bucket = grouped.get(key) ?? []
    bucket.push(row.finalStage)
    grouped.set(key, bucket)
  }
  for (const [key, stages] of grouped) {
    const champions = stages.filter((s) => s === "CHAMPION").length
    const runnerUps = stages.filter((s) => s === "RUNNER_UP").length
    if (champions > 1 || runnerUps > 1) {
      return `Inconsistencia en ${key}: solo puede haber 1 campeon y 1 subcampeon`
    }
  }
  return null
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

    const body = await request.json()
    const parsed = manualResultsSubmissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const consistencyError = validateStageConsistency(parsed.data.rows)
    if (consistencyError) {
      return NextResponse.json({ success: false, error: consistencyError }, { status: 400 })
    }

    const submission = await prisma.tournamentResultSubmission.create({
      data: {
        tournamentId: id,
        submittedByUserId: session!.user.id,
        submissionType: "MANUAL",
        status: "PENDING_REVIEW",
        validationNotes: parsed.data.notes || undefined,
        rows: {
          create: parsed.data.rows.map((row) => ({
            tournamentId: id,
            modality: row.modality,
            category: row.category,
            finalStage: row.finalStage,
            player1Id: row.player1Id,
            player2Id: row.player2Id,
            importedPlayer1Name: row.importedPlayer1Name || undefined,
            importedPlayer2Name: row.importedPlayer2Name || undefined,
            sourceClubId: tournament.clubId,
          })),
        },
      },
      include: { rows: true },
    })

    return NextResponse.json({ success: true, data: submission }, { status: 201 })
  } catch (err) {
    console.error("Error creating manual result submission:", err)
    return NextResponse.json({ success: false, error: "Error al cargar resultados manuales" }, { status: 500 })
  }
}

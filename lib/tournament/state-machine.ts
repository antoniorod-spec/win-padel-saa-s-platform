import { prisma } from "@/lib/prisma"
import { TournamentStatus } from "@prisma/client"

type TransitionResult = { valid: boolean; errors: string[] }

export async function validateTransition(
  tournamentId: string,
  targetStatus: TournamentStatus
): Promise<TransitionResult> {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  })
  if (!t) return { valid: false, errors: ["Torneo no encontrado"] }

  const current = t.status

  const allowed: Record<TournamentStatus, TournamentStatus[]> = {
    DRAFT: ["OPEN", "CANCELLED"],
    OPEN: ["CLOSED", "CANCELLED"],
    CLOSED: ["GENERATED", "CANCELLED"],
    GENERATED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["ELIMINATIONS", "COMPLETED", "CANCELLED"],
    ELIMINATIONS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  }

  if (!(allowed[current] ?? []).includes(targetStatus)) {
    return { valid: false, errors: [`Transicion invalida: ${current} -> ${targetStatus}`] }
  }

  const errors: string[] = []

  if (current === "DRAFT" && targetStatus === "OPEN") {
    const [courts, modalities] = await Promise.all([
      prisma.court.count({ where: { tournamentId } }),
      prisma.tournamentModality.count({ where: { tournamentId } }),
    ])
    if (courts < 1) errors.push("Configura al menos 1 cancha antes de abrir inscripcion")
    if (modalities < 1) errors.push("Configura al menos 1 modalidad antes de abrir inscripcion")
  }

  if (current === "CLOSED" && targetStatus === "GENERATED") {
    const modalities = await prisma.tournamentModality.findMany({
      where: { tournamentId },
      select: { id: true },
    })
    if (modalities.length === 0) errors.push("No hay modalidades para generar")

    for (const m of modalities) {
      const groupsCount = await prisma.tournamentGroup.count({ where: { tournamentModalityId: m.id } })
      if (groupsCount === 0) {
        // Permit modalities with no teams; skip strictness to avoid blocking.
        const regCount = await prisma.tournamentRegistration.count({ where: { tournamentModalityId: m.id } })
        if (regCount > 0) errors.push(`Faltan grupos en modalidad ${m.id}`)
      }
    }

    const scheduled = await prisma.match.count({
      where: {
        tournamentModality: { tournamentId },
        phase: "GROUP_STAGE",
        slotId: { not: null },
      },
    })
    if (scheduled === 0) errors.push("Genera el rol de juegos (slots asignados) antes de marcar como GENERATED")
  }

  if (current === "GENERATED" && targetStatus === "IN_PROGRESS") {
    const played = await prisma.match.count({
      where: {
        tournamentModality: { tournamentId },
        winner: { not: "NONE" },
      },
    })
    if (played === 0) errors.push("Aun no hay resultados registrados")
  }

  if (targetStatus === "ELIMINATIONS") {
    const pendingGroups = await prisma.match.count({
      where: {
        tournamentModality: { tournamentId },
        phase: "GROUP_STAGE",
        winner: "NONE",
      },
    })
    if (pendingGroups > 0) errors.push("Aun hay partidos de grupos pendientes")
  }

  if (targetStatus === "COMPLETED") {
    const finalsPending = await prisma.match.count({
      where: {
        tournamentModality: { tournamentId },
        roundName: "Final",
        winner: "NONE",
      },
    })
    if (finalsPending > 0) errors.push("Aun hay finales pendientes")
  }

  return { valid: errors.length === 0, errors }
}

export async function transitionTournament(
  tournamentId: string,
  targetStatus: TournamentStatus
) {
  const validation = await validateTransition(tournamentId, targetStatus)
  if (!validation.valid) return { success: false, errors: validation.errors, tournament: null }

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: targetStatus },
  })

  return { success: true, errors: [], tournament }
}


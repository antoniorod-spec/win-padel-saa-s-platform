import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { parseSpreadsheet } from "@/lib/utils/file-parser"
import { findPlayerByPhone } from "@/lib/services/imported-roster-service"
import { matchModalityByCategory, parsePairRow } from "@/lib/utils/import-validation"

export type ValidatedRowValid = {
  rowIndex: number
  status: "valid"
  player1: string
  player2: string
  player1Id: string
  player2Id: string
  modalityId: string
  modalityLabel: string
  p1Phone: string
  p2Phone: string
}

export type ValidatedRowWarning = {
  rowIndex: number
  status: "warning"
  player1: string
  player2: string
  player1Id?: string
  player2Id?: string
  modalityId?: string
  modalityLabel?: string
  reason: string
  p1Phone: string
  p2Phone: string
}

export type ValidatedRowError = {
  rowIndex: number
  status: "error"
  player1?: string
  player2?: string
  reason: string
  p1Phone?: string
  p2Phone?: string
  missingField?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const formData = await request.formData()
    const file = formData.get("file")
    const tournamentModalityId = String(formData.get("tournamentModalityId") || "").trim() || null

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        club: true,
        modalities: { select: { id: true, modality: true, category: true } },
      },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const rows = await parseSpreadsheet(file)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "El archivo no contiene filas" }, { status: 400 })
    }

    const valid: ValidatedRowValid[] = []
    const warnings: ValidatedRowWarning[] = []
    const errors: ValidatedRowError[] = []

    const modalities = tournament.modalities.map((m) => ({
      id: m.id,
      modality: m.modality,
      category: m.category,
    }))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const parsed = parsePairRow(row)

      if (!parsed) {
        errors.push({
          rowIndex: i + 1,
          status: "error",
          reason: "Datos incompletos: teléfonos y nombres requeridos",
          missingField: "telefonos_o_nombres",
        })
        continue
      }

      const { p1Phone, p2Phone, p1First, p1Last, p2First, p2Last, category } = parsed
      const player1Label = `${p1First} ${p1Last}`.trim()
      const player2Label = `${p2First} ${p2Last}`.trim()

      const p1 = await findPlayerByPhone(p1Phone)
      const p2 = await findPlayerByPhone(p2Phone)

      if (!p1) {
        errors.push({
          rowIndex: i + 1,
          status: "error",
          player1: player1Label,
          player2: player2Label,
          reason: "Jugador 1 no encontrado en la plataforma",
          p1Phone,
          p2Phone,
          missingField: "player1",
        })
        continue
      }

      if (!p2) {
        errors.push({
          rowIndex: i + 1,
          status: "error",
          player1: player1Label,
          player2: player2Label,
          reason: "Jugador 2 no encontrado en la plataforma",
          p1Phone,
          p2Phone,
          missingField: "player2",
        })
        continue
      }

      if (p1.id === p2.id) {
        errors.push({
          rowIndex: i + 1,
          status: "error",
          player1: player1Label,
          player2: player2Label,
          reason: "Los dos jugadores deben ser diferentes",
          p1Phone,
          p2Phone,
        })
        continue
      }

      let targetModalityId = tournamentModalityId
      let modalityLabel = ""

      if (!targetModalityId) {
        if (!category) {
          warnings.push({
            rowIndex: i + 1,
            status: "warning",
            player1: player1Label,
            player2: player2Label,
            player1Id: p1.id,
            player2Id: p2.id,
            reason: "Categoría no especificada en el archivo",
            p1Phone,
            p2Phone,
          })
          continue
        }
        const matched = matchModalityByCategory(modalities, category)
        if (!matched) {
          warnings.push({
            rowIndex: i + 1,
            status: "warning",
            player1: player1Label,
            player2: player2Label,
            player1Id: p1.id,
            player2Id: p2.id,
            reason: `Categoría no reconocida: "${category}". Reasigna manualmente.`,
            p1Phone,
            p2Phone,
          })
          continue
        }
        targetModalityId = matched.id
        const mod = modalities.find((m) => m.id === matched.id)
        modalityLabel = mod ? `${mod.category} ${mod.modality}` : ""
      } else {
        const mod = modalities.find((m) => m.id === targetModalityId)
        modalityLabel = mod ? `${mod.category} ${mod.modality}` : ""
      }

      valid.push({
        rowIndex: i + 1,
        status: "valid",
        player1: player1Label,
        player2: player2Label,
        player1Id: p1.id,
        player2Id: p2.id,
        modalityId: targetModalityId,
        modalityLabel,
        p1Phone,
        p2Phone,
      })
    }

    // Detectar jugadores duplicados EN LA MISMA CATEGORÍA: un jugador no puede estar en más de una pareja por categoría
    const playerModalityToRows = new Map<string, { rowIndex: number; pairLabel: string }[]>()
    for (const v of valid) {
      const key1 = `${v.player1Id}::${v.modalityId}`
      const key2 = `${v.player2Id}::${v.modalityId}`
      const entry = { rowIndex: v.rowIndex, pairLabel: `${v.player1} / ${v.player2}` }
      for (const key of [key1, key2]) {
        const list = playerModalityToRows.get(key) ?? []
        list.push(entry)
        playerModalityToRows.set(key, list)
      }
    }
    const duplicateKeys = new Set<string>()
    for (const [key, list] of playerModalityToRows) {
      if (list.length > 1) duplicateKeys.add(key)
    }
    const rowsWithDuplicates = new Set<number>()
    for (const key of duplicateKeys) {
      for (const { rowIndex } of playerModalityToRows.get(key)!) {
        rowsWithDuplicates.add(rowIndex)
      }
    }
    const validFiltered: ValidatedRowValid[] = []
    for (const v of valid) {
      if (rowsWithDuplicates.has(v.rowIndex)) {
        const dupNames = [v.player1Id, v.player2Id]
          .filter((id) => duplicateKeys.has(`${id}::${v.modalityId}`))
          .map((id) => (id === v.player1Id ? v.player1 : v.player2))
        errors.push({
          rowIndex: v.rowIndex,
          status: "error",
          player1: v.player1,
          player2: v.player2,
          reason: `Jugador duplicado en ${v.modalityLabel}: ${dupNames.join(", ")} ya aparece en otra pareja de esta categoría. Un jugador solo puede tener una pareja por categoría.`,
          p1Phone: v.p1Phone,
          p2Phone: v.p2Phone,
        })
      } else {
        validFiltered.push(v)
      }
    }

    // Verificar jugadores ya inscritos en la BD para esta categoría
    const existingRegs = await prisma.tournamentRegistration.findMany({
      where: {
        tournamentModality: { tournamentId: id },
      },
      select: { player1Id: true, player2Id: true, tournamentModalityId: true },
    })
    const playerInModality = new Set<string>()
    for (const r of existingRegs) {
      playerInModality.add(`${r.player1Id}::${r.tournamentModalityId}`)
      playerInModality.add(`${r.player2Id}::${r.tournamentModalityId}`)
    }
    const validFiltered2: ValidatedRowValid[] = []
    for (const v of validFiltered) {
      const p1Key = `${v.player1Id}::${v.modalityId}`
      const p2Key = `${v.player2Id}::${v.modalityId}`
      if (playerInModality.has(p1Key) || playerInModality.has(p2Key)) {
        const dupName = playerInModality.has(p1Key) ? v.player1 : v.player2
        errors.push({
          rowIndex: v.rowIndex,
          status: "error",
          player1: v.player1,
          player2: v.player2,
          reason: `${dupName} ya está inscrito en ${v.modalityLabel} con otra pareja.`,
          p1Phone: v.p1Phone,
          p2Phone: v.p2Phone,
        })
      } else {
        validFiltered2.push(v)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        valid: validFiltered2,
        warnings,
        errors,
        totalRows: rows.length,
      },
    })
  } catch (err) {
    console.error("Validate import error:", err)
    return NextResponse.json(
      { success: false, error: "Error al validar archivo" },
      { status: 500 }
    )
  }
}

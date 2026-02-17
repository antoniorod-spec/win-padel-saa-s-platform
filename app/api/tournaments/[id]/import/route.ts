import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { parseSpreadsheet } from "@/lib/utils/file-parser"
import { ensureImportedPlayer, ensureLinkedPlayer, findOrCreatePlayerByPhone } from "@/lib/services/imported-roster-service"

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ""
}

function toInt(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: "", lastName: "" }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

function matchModalityByCategory(
  modalities: Array<{ id: string; modality: string; category: string }>,
  categoryStr: string
): { id: string } | null {
  const normalized = categoryStr.trim().toUpperCase().replace(/\s+/g, " ")
  for (const m of modalities) {
    const modCat = `${m.modality} ${m.category}`.toUpperCase()
    if (modCat === normalized || modCat.includes(normalized) || normalized.includes(modCat)) {
      return { id: m.id }
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

    const formData = await request.formData()
    const file = formData.get("file")
    const tournamentModalityId = String(formData.get("tournamentModalityId") || "").trim() || null
    const importType = String(formData.get("importType") || "pairs")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 })
    }
    if (!["players", "pairs"].includes(importType)) {
      return NextResponse.json({ success: false, error: "importType invalido" }, { status: 400 })
    }
    if (importType === "players" && !tournamentModalityId) {
      return NextResponse.json({ success: false, error: "tournamentModalityId requerido para importar jugadores" }, { status: 400 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { club: true, modalities: { select: { id: true, modality: true, category: true, maxPairs: true } } },
    })
    if (!tournament) {
      return NextResponse.json({ success: false, error: "Torneo no encontrado" }, { status: 404 })
    }
    if (session!.user.role !== "ADMIN" && tournament.club.userId !== session!.user.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    let modality: { id: string; tournamentId: string; maxPairs: number | null } | null = null
    if (tournamentModalityId) {
      modality = await prisma.tournamentModality.findUnique({
        where: { id: tournamentModalityId },
      })
      if (!modality || modality.tournamentId !== id) {
        return NextResponse.json({ success: false, error: "Modalidad invalida" }, { status: 400 })
      }
    }

    const modalityMaxPairs = (modId: string) => {
      const m = tournament!.modalities.find((x) => x.id === modId)
      return m?.maxPairs ?? tournament!.maxTeams
    }
    const existingCounts = await prisma.tournamentRegistration.groupBy({
      by: ["tournamentModalityId"],
      where: { tournamentModality: { tournamentId: id } },
      _count: true,
    })
    const countByModality = new Map(existingCounts.map((c) => [c.tournamentModalityId, c._count]))
    const batchAddedByModality = new Map<string, number>()

    const rows = await parseSpreadsheet(file)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "El archivo no contiene filas" }, { status: 400 })
    }

    const batch = await prisma.tournamentImportBatch.create({
      data: {
        tournamentId: id,
        tournamentModalityId: tournamentModalityId || undefined,
        sourceClubId: tournament.club.id,
        fileName: file.name,
        importType,
        totalRows: rows.length,
      },
    })

    let importedRows = 0
    let failedRows = 0

    for (const row of rows) {
      try {
        if (importType === "players") {
          const firstName = pick(row, ["first_name", "nombre", "name"])
          const lastName = pick(row, ["last_name", "apellido", "lastname"])
          if (!firstName || !lastName) throw new Error("Nombre incompleto")

          await ensureImportedPlayer({
            firstName,
            lastName,
            phone: pick(row, ["phone", "telefono", "celular"]),
            email: pick(row, ["email", "correo"]),
            city: pick(row, ["city", "ciudad"]),
            country: pick(row, ["country", "pais"]),
            sex: (pick(row, ["sex", "genero"]) || "").toUpperCase() === "F" ? "F" : "M",
            sourceClubId: tournament.club.id,
          })
        } else {
          // Soporte plantilla 7 columnas: Nombre J1, Apellido J1, Teléfono J1, Nombre J2, Apellido J2, Teléfono J2, Categoría
          // Soporte plantilla 8 columnas: Nombre J1, Teléfono J1, Email J1, Nombre J2, Teléfono J2, Email J2, Categoría
          const p1Phone = pick(row, [
            "player1_phone", "telefono1", "celular1", "telefono_j1", "telefono_jugador_1",
            "player1_telefono", "jugador1_telefono",
          ])
          const p2Phone = pick(row, [
            "player2_phone", "telefono2", "celular2", "telefono_j2", "telefono_jugador_2",
            "player2_telefono", "jugador2_telefono",
          ])
          if (!p1Phone || !p2Phone) throw new Error("Teléfonos requeridos para ambos jugadores")

          let p1First: string
          let p1Last: string
          let p2First: string
          let p2Last: string

          const p1NameCol = pick(row, [
            "player1_first_name", "jugador1_nombre", "nombre1", "player1_name",
            "nombre_j1", "nombre_jugador_1", "player1_nombre",
          ])
          const p1LastCol = pick(row, [
            "player1_last_name", "jugador1_apellido", "apellido1", "player1_lastname",
            "apellido_j1", "apellido_jugador_1",
          ])
          const p2NameCol = pick(row, [
            "player2_first_name", "jugador2_nombre", "nombre2", "player2_name",
            "nombre_j2", "nombre_jugador_2", "player2_nombre",
          ])
          const p2LastCol = pick(row, [
            "player2_last_name", "jugador2_apellido", "apellido2", "player2_lastname",
            "apellido_j2", "apellido_jugador_2",
          ])

          if (p1NameCol && p1LastCol) {
            p1First = p1NameCol
            p1Last = p1LastCol
          } else if (p1NameCol) {
            const parsed = parseFullName(p1NameCol)
            p1First = parsed.firstName
            p1Last = parsed.lastName || parsed.firstName
          } else {
            throw new Error("Nombre jugador 1 requerido")
          }

          if (p2NameCol && p2LastCol) {
            p2First = p2NameCol
            p2Last = p2LastCol
          } else if (p2NameCol) {
            const parsed = parseFullName(p2NameCol)
            p2First = parsed.firstName
            p2Last = parsed.lastName || parsed.firstName
          } else {
            throw new Error("Nombre jugador 2 requerido")
          }

          let targetModalityId = tournamentModalityId
          if (!targetModalityId) {
            const catCol = pick(row, ["categoria", "category", "modalidad"])
            if (!catCol) throw new Error("Columna Categoría requerida para importación global")
            const matched = matchModalityByCategory(
              tournament.modalities.map((m) => ({ id: m.id, modality: m.modality, category: m.category })),
              catCol
            )
            if (!matched) throw new Error(`Categoría no encontrada: ${catCol}`)
            targetModalityId = matched.id
          }

          const player1Id = await findOrCreatePlayerByPhone({
            phone: p1Phone,
            firstName: p1First,
            lastName: p1Last,
            email: pick(row, ["player1_email", "correo1", "email1", "email_j1"]) || undefined,
            sourceClubId: tournament.club.id,
          })
          const player2Id = await findOrCreatePlayerByPhone({
            phone: p2Phone,
            firstName: p2First,
            lastName: p2Last,
            email: pick(row, ["player2_email", "correo2", "email2", "email_j2"]) || undefined,
            sourceClubId: tournament.club.id,
          })

          if (!player1Id || !player2Id) throw new Error("No se pudo crear o encontrar jugadores")
          if (player1Id === player2Id) throw new Error("Los dos jugadores deben ser diferentes")

          const existing = await prisma.tournamentRegistration.findUnique({
            where: {
              tournamentModalityId_player1Id_player2Id: {
                tournamentModalityId: targetModalityId,
                player1Id,
                player2Id,
              },
            },
          })
          const isNew = !existing
          if (isNew) {
            const current = (countByModality.get(targetModalityId) ?? 0) + (batchAddedByModality.get(targetModalityId) ?? 0)
            const maxAllowed = modalityMaxPairs(targetModalityId)
            if (current >= maxAllowed) throw new Error(`Categoría llena (máx. ${maxAllowed} parejas)`)
            batchAddedByModality.set(targetModalityId, (batchAddedByModality.get(targetModalityId) ?? 0) + 1)
          }

          await prisma.tournamentRegistration.upsert({
            where: {
              tournamentModalityId_player1Id_player2Id: {
                tournamentModalityId: targetModalityId,
                player1Id,
                player2Id,
              },
            },
            update: {
              seed: toInt(pick(row, ["seed", "siembra"])),
              paymentStatus: "CONFIRMED",
            },
            create: {
              tournamentModalityId: targetModalityId,
              player1Id,
              player2Id,
              seed: toInt(pick(row, ["seed", "siembra"])),
              paymentStatus: "CONFIRMED",
              paymentAmount: tournament.inscriptionPrice,
            },
          })
        }
        importedRows += 1
      } catch {
        failedRows += 1
      }
    }

    await prisma.tournamentImportBatch.update({
      where: { id: batch.id },
      data: { importedRows, failedRows },
    })

    return NextResponse.json({
      success: true,
      data: {
        batchId: batch.id,
        totalRows: rows.length,
        importedRows,
        failedRows,
      },
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { success: false, error: "Error al importar archivo" },
      { status: 500 }
    )
  }
}

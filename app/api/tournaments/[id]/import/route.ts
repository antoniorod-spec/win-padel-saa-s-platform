import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { parseSpreadsheet } from "@/lib/utils/file-parser"
import { ensureImportedPlayer, ensureLinkedPlayer } from "@/lib/services/imported-roster-service"

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
    const tournamentModalityId = String(formData.get("tournamentModalityId") || "")
    const importType = String(formData.get("importType") || "pairs")

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Archivo requerido" }, { status: 400 })
    }
    if (!tournamentModalityId) {
      return NextResponse.json({ success: false, error: "tournamentModalityId requerido" }, { status: 400 })
    }
    if (!["players", "pairs"].includes(importType)) {
      return NextResponse.json({ success: false, error: "importType invalido" }, { status: 400 })
    }

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

    const modality = await prisma.tournamentModality.findUnique({
      where: { id: tournamentModalityId },
    })
    if (!modality || modality.tournamentId !== id) {
      return NextResponse.json({ success: false, error: "Modalidad invalida" }, { status: 400 })
    }

    const rows = await parseSpreadsheet(file)
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "El archivo no contiene filas" }, { status: 400 })
    }

    const batch = await prisma.tournamentImportBatch.create({
      data: {
        tournamentId: id,
        tournamentModalityId,
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
          const p1First = pick(row, ["player1_first_name", "jugador1_nombre", "nombre1", "player1_name"])
          const p1Last = pick(row, ["player1_last_name", "jugador1_apellido", "apellido1", "player1_lastname"])
          const p2First = pick(row, ["player2_first_name", "jugador2_nombre", "nombre2", "player2_name"])
          const p2Last = pick(row, ["player2_last_name", "jugador2_apellido", "apellido2", "player2_lastname"])

          if (!p1First || !p1Last || !p2First || !p2Last) {
            throw new Error("Pareja incompleta")
          }

          const importedP1 = await ensureImportedPlayer({
            firstName: p1First,
            lastName: p1Last,
            phone: pick(row, ["player1_phone", "telefono1", "celular1"]),
            email: pick(row, ["player1_email", "correo1"]),
            sourceClubId: tournament.club.id,
          })
          const importedP2 = await ensureImportedPlayer({
            firstName: p2First,
            lastName: p2Last,
            phone: pick(row, ["player2_phone", "telefono2", "celular2"]),
            email: pick(row, ["player2_email", "correo2"]),
            sourceClubId: tournament.club.id,
          })

          const player1Id = await ensureLinkedPlayer(importedP1.id)
          const player2Id = await ensureLinkedPlayer(importedP2.id)

          const registration = await prisma.tournamentRegistration.upsert({
            where: {
              tournamentModalityId_player1Id_player2Id: {
                tournamentModalityId,
                player1Id,
                player2Id,
              },
            },
            update: {
              seed: toInt(pick(row, ["seed", "siembra"])),
              paymentStatus: "CONFIRMED",
            },
            create: {
              tournamentModalityId,
              player1Id,
              player2Id,
              seed: toInt(pick(row, ["seed", "siembra"])),
              paymentStatus: "CONFIRMED",
              paymentAmount: tournament.inscriptionPrice,
            },
          })

          await prisma.importedTournamentEntry.upsert({
            where: {
              tournamentModalityId_importedPlayer1Id_importedPlayer2Id: {
                tournamentModalityId,
                importedPlayer1Id: importedP1.id,
                importedPlayer2Id: importedP2.id,
              },
            },
            update: {
              linkedRegistrationId: registration.id,
              seed: toInt(pick(row, ["seed", "siembra"])),
            },
            create: {
              importBatchId: batch.id,
              tournamentId: id,
              tournamentModalityId,
              importedPlayer1Id: importedP1.id,
              importedPlayer2Id: importedP2.id,
              linkedRegistrationId: registration.id,
              seed: toInt(pick(row, ["seed", "siembra"])),
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

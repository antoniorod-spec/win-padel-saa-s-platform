import { prisma } from "@/lib/prisma"
import { normalizeFullName, normalizePhone } from "@/lib/utils/file-parser"

type UpsertImportedPlayerInput = {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  city?: string
  country?: string
  sex?: "M" | "F"
  sourceClubId?: string
}

function syntheticEmail(firstName: string, lastName: string): string {
  const slug = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
  return `${slug}.${Date.now()}.${Math.floor(Math.random() * 1000)}@import.local`
}

export async function ensureImportedPlayer(input: UpsertImportedPlayerInput) {
  const fullNameNormalized = normalizeFullName(input.firstName, input.lastName)
  const phone = normalizePhone(input.phone)

  const existing = await prisma.importedPlayer.findFirst({
    where: {
      fullNameNormalized,
      phone,
    },
  })

  if (existing) return existing

  const created = await prisma.importedPlayer.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      fullNameNormalized,
      phone,
      email: input.email?.trim() || null,
      city: input.city?.trim() || null,
      country: input.country?.trim() || "MX",
      sex: input.sex,
      sourceClubId: input.sourceClubId,
    },
  })

  return created
}

export async function ensureLinkedPlayer(importedPlayerId: string) {
  const imported = await prisma.importedPlayer.findUnique({
    where: { id: importedPlayerId },
  })
  if (!imported) throw new Error("Jugador importado no encontrado")

  if (imported.linkedPlayerId) return imported.linkedPlayerId

  const user = await prisma.user.create({
    data: {
      email: imported.email || syntheticEmail(imported.firstName, imported.lastName),
      name: `${imported.firstName} ${imported.lastName}`.trim(),
      role: "PLAYER",
      player: {
        create: {
          firstName: imported.firstName,
          lastName: imported.lastName,
          sex: imported.sex || "M",
          city: imported.city || "Por definir",
          country: imported.country || "MX",
          phone: imported.phone || null,
        },
      },
    },
    include: { player: true },
  })

  await prisma.importedPlayer.update({
    where: { id: importedPlayerId },
    data: {
      linkedPlayerId: user.player!.id,
      linkStatus: "LINKED",
    },
  })

  return user.player!.id
}

export async function reconcileImportedPlayerWithRegistered(params: {
  playerId: string
  firstName: string
  lastName: string
  phone?: string | null
}) {
  const fullNameNormalized = normalizeFullName(params.firstName, params.lastName)
  const normalizedPhone = normalizePhone(params.phone)
  if (!normalizedPhone) return { linked: false, conflicts: 0 }

  const matches = await prisma.importedPlayer.findMany({
    where: {
      fullNameNormalized,
      phone: normalizedPhone,
    },
  })

  if (matches.length === 0) return { linked: false, conflicts: 0 }

  if (matches.length > 1) {
    await prisma.importedPlayer.updateMany({
      where: { id: { in: matches.map((m) => m.id) } },
      data: { linkStatus: "CONFLICT" },
    })
    return { linked: false, conflicts: matches.length }
  }

  const imported = matches[0]
  const previousLinkedId = imported.linkedPlayerId

  await prisma.$transaction(async (tx) => {
    if (previousLinkedId && previousLinkedId !== params.playerId) {
      await tx.tournamentRegistration.updateMany({
        where: { player1Id: previousLinkedId },
        data: { player1Id: params.playerId },
      })
      await tx.tournamentRegistration.updateMany({
        where: { player2Id: previousLinkedId },
        data: { player2Id: params.playerId },
      })
    }

    await tx.importedPlayer.update({
      where: { id: imported.id },
      data: {
        linkedPlayerId: params.playerId,
        linkStatus: "LINKED",
      },
    })
  })

  return { linked: true, conflicts: 0 }
}

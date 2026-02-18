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

  // Priorizar teléfono: si hay teléfono, buscar primero solo por teléfono (identificador único)
  if (phone) {
    const byPhone = await prisma.importedPlayer.findFirst({
      where: { phone },
    })
    if (byPhone) return byPhone
  }

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

export type FindOrCreatePlayerByPhoneInput = {
  phone: string
  firstName: string
  lastName: string
  email?: string
  sourceClubId?: string
  sex?: "M" | "F"
  city?: string
  country?: string
}

/**
 * Busca o crea un jugador usando el teléfono como identificador único.
 * 1. Busca Player por teléfono
 * 2. Si no existe, busca ImportedPlayer por teléfono y vincula
 * 3. Si no existe, crea ImportedPlayer y vincula a Player
 */
export async function findOrCreatePlayerByPhone(
  input: FindOrCreatePlayerByPhoneInput
): Promise<string | null> {
  const normalizedPhone = normalizePhone(input.phone)
  if (!normalizedPhone) return null

  const existingPlayer = await prisma.player.findFirst({
    where: { phone: normalizedPhone },
  })
  if (existingPlayer) return existingPlayer.id

  const imported = await prisma.importedPlayer.findFirst({
    where: { phone: normalizedPhone },
  })
  if (imported) return ensureLinkedPlayer(imported.id)

  const created = await ensureImportedPlayer({
    phone: input.phone,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email,
    sourceClubId: input.sourceClubId,
    sex: input.sex,
    city: input.city,
    country: input.country,
  })
  return ensureLinkedPlayer(created.id)
}

/**
 * Busca un Player existente por teléfono. No crea ninguno.
 * Busca en Player y en ImportedPlayer (vinculado a Player).
 */
export async function findPlayerByPhone(phone: string): Promise<{ id: string; firstName: string; lastName: string } | null> {
  const normalized = normalizePhone(phone)
  if (!normalized) return null

  const player = await prisma.player.findFirst({
    where: { phone: normalized },
    select: { id: true, firstName: true, lastName: true },
  })
  if (player) return player

  const imported = await prisma.importedPlayer.findFirst({
    where: { phone: normalized },
    select: { linkedPlayerId: true, firstName: true, lastName: true },
  })
  if (imported?.linkedPlayerId) {
    const linked = await prisma.player.findUnique({
      where: { id: imported.linkedPlayerId },
      select: { id: true, firstName: true, lastName: true },
    })
    return linked
  }
  return null
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

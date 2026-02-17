import { z } from "zod"

const baseTournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string().datetime().or(z.string().min(1, "Fecha de inicio requerida")),
  endDate: z.string().datetime().or(z.string().min(1, "Fecha de fin requerida")),
  registrationDeadline: z.string().datetime().or(z.string().min(1)).optional(),
  registrationOpensAt: z.string().datetime().or(z.string().min(1)).optional(),
  officialBall: z.string().max(100).optional().nullable(),
  supportWhatsApp: z.string().max(50).optional().nullable(),
  category: z.enum(["ANUAL", "OPEN", "REGULAR", "EXPRESS"]),
  format: z.enum(["ELIMINATION", "ROUND_ROBIN", "LEAGUE", "EXPRESS"]),
  type: z.enum(["FULL", "BASIC"]).default("FULL"),
  affectsRanking: z.boolean().optional(),
  prize: z.string().optional(),
  sponsorName: z.string().optional(),
  sponsorLogoUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  posterUrl: z.string().url().optional().or(z.literal("")),
  externalRegistrationType: z.enum(["URL", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "OTHER"]).optional(),
  externalRegistrationLink: z.string().url().optional().or(z.literal("")),
  images: z.array(z.string().url()).optional(),
  news: z.array(z.object({
    title: z.string().min(3),
    body: z.string().min(3),
    publishedAt: z.string().optional(),
  })).optional(),
  inscriptionPrice: z.number().min(0).optional(),
  maxTeams: z.number().int().min(2).max(128).optional(),
  matchDurationMinutes: z.number().int().min(15).max(180).optional(),
  minPairsPerModality: z.number().int().min(2).max(128).optional(),
  rulesPdfUrl: z.string().url().optional().or(z.literal("")),
  rules: z.object({
    setsPerMatch: z.number().int().min(1).max(5).optional(),
    gamesPerSet: z.number().int().optional(),
    tieBreak: z.string().optional(),
    goldenPoint: z.boolean().optional(),
    thirdSetTiebreakTo10: z.boolean().optional(),
  }).optional(),
  modalities: z.array(z.object({
    modality: z.enum(["VARONIL", "FEMENIL", "MIXTO"]),
    category: z.string().min(1),
    prizeType: z.enum(["CASH", "GIFT"]).optional().nullable(),
    prizeAmount: z.number().min(0).optional().nullable(),
    prizeDescription: z.string().optional().nullable(),
    minPairs: z.number().int().min(2).max(128).optional().nullable(),
    maxPairs: z.number().int().min(2).max(128).optional().nullable(),
  })).optional(),
})

export const createTournamentSchema = baseTournamentSchema.refine((data) => {
  if (data.type === "BASIC") return true
  return Array.isArray(data.modalities) && data.modalities.length > 0
}, { message: "Se requiere al menos una modalidad para torneos FULL", path: ["modalities"] })

export const updateTournamentSchema = baseTournamentSchema.partial()

export const registerTeamSchema = z.object({
  tournamentModalityId: z.string().cuid(),
  player1Id: z.string().cuid(),
  player2Id: z.string().cuid(),
})

const playerByPhoneSchema = z.object({
  phone: z.string().min(1, "Teléfono requerido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email().optional().or(z.literal("")),
})

export const registerManualSchema = z.object({
  tournamentModalityId: z.string().cuid(),
  player1: z.union([
    z.object({ playerId: z.string().cuid() }),
    playerByPhoneSchema,
  ]),
  player2: z.union([
    z.object({ playerId: z.string().cuid() }),
    playerByPhoneSchema,
  ]),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type RegisterTeamInput = z.infer<typeof registerTeamSchema>

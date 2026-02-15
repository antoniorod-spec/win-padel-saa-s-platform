import { z } from "zod"

export const createTournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  startDate: z.string().datetime().or(z.string().min(1, "Fecha de inicio requerida")),
  endDate: z.string().datetime().or(z.string().min(1, "Fecha de fin requerida")),
  category: z.enum(["A", "B", "C"]),
  format: z.enum(["ELIMINATION", "ROUND_ROBIN", "LEAGUE", "EXPRESS"]),
  prize: z.string().optional(),
  inscriptionPrice: z.number().min(0).optional(),
  maxTeams: z.number().int().min(2).max(128).optional(),
  rules: z.object({
    setsPerMatch: z.number().int().min(1).max(5).optional(),
    gamesPerSet: z.number().int().optional(),
    tieBreak: z.string().optional(),
    goldenPoint: z.boolean().optional(),
  }).optional(),
  modalities: z.array(z.object({
    modality: z.enum(["VARONIL", "FEMENIL", "MIXTO"]),
    category: z.string().min(1),
  })).min(1, "Se requiere al menos una modalidad"),
})

export const updateTournamentSchema = createTournamentSchema.partial()

export const registerTeamSchema = z.object({
  tournamentModalityId: z.string().cuid(),
  player1Id: z.string().cuid(),
  player2Id: z.string().cuid(),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type RegisterTeamInput = z.infer<typeof registerTeamSchema>

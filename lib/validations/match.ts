import { z } from "zod"

export const updateScoreSchema = z.object({
  winner: z.enum(["TEAM_A", "TEAM_B"]),
  scores: z.array(z.object({
    setA: z.number().int().min(0),
    setB: z.number().int().min(0),
  })).min(1, "Se requiere al menos un set"),
  playedAt: z.string().datetime().optional(),
})

export type UpdateScoreInput = z.infer<typeof updateScoreSchema>

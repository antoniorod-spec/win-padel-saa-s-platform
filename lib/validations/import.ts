import { z } from "zod"

export const importRequestSchema = z.object({
  importType: z.enum(["players", "pairs"]),
  tournamentModalityId: z.string().cuid(),
  fileName: z.string().min(3),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
})

export const importPlayerRowSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  sex: z.enum(["M", "F"]).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export const importPairRowSchema = z.object({
  player1FirstName: z.string().min(2),
  player1LastName: z.string().min(2),
  player1Phone: z.string().min(8).optional(),
  player1Email: z.string().email().optional(),
  player2FirstName: z.string().min(2),
  player2LastName: z.string().min(2),
  player2Phone: z.string().min(8).optional(),
  player2Email: z.string().email().optional(),
  seed: z.number().int().positive().optional(),
})

export type ImportRequestInput = z.infer<typeof importRequestSchema>

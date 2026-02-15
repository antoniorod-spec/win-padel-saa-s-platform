import { z } from "zod"

export const updatePlayerSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  age: z.number().int().min(10).max(99).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
})

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>

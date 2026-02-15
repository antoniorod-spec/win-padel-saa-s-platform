import { z } from "zod"

export const updateClubSchema = z.object({
  name: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  courts: z.number().int().min(0).optional(),
})

export type UpdateClubInput = z.infer<typeof updateClubSchema>

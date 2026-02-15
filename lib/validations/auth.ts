import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
})

export const registerPlayerSchema = z.object({
  type: z.literal("player"),
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  sex: z.enum(["M", "F"]),
  city: z.string().min(2, "La ciudad es requerida"),
  country: z.string().min(2, "El pais es requerido"),
  age: z.number().int().min(10).max(99).optional(),
})

export const registerClubSchema = z.object({
  type: z.literal("club"),
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  clubName: z.string().min(3, "El nombre del club debe tener al menos 3 caracteres"),
  city: z.string().min(2, "La ciudad es requerida"),
  courts: z.number().int().min(1).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>
export type RegisterClubInput = z.infer<typeof registerClubSchema>

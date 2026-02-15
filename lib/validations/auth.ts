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

// Schema simplificado para registro inicial de club (solo email + password)
export const registerClubInitialSchema = z.object({
  type: z.literal("club"),
  email: z.string().email("Correo electronico invalido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
})

// Paso 1: Datos del Responsable
export const clubResponsibleSchema = z.object({
  contactName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  contactPhone: z.string().min(10, "El telefono debe tener al menos 10 digitos"),
  contactEmail: z.string().email("Correo electronico invalido").transform(val => val === "" ? undefined : val).optional(),
  contactPosition: z.string().transform(val => val === "" ? undefined : val).optional(),
})

// Paso 2: Datos del Club
export const clubInfoSchema = z.object({
  clubName: z.string().min(3, "El nombre del club debe tener al menos 3 caracteres"),
  legalName: z.string().min(3, "La razon social debe tener al menos 3 caracteres").transform(val => val === "" ? undefined : val).optional(),
  rfc: z.string().min(12).max(13).regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "RFC invalido"),
  clubPhone: z.string().min(10, "El telefono debe tener al menos 10 digitos"),
  clubEmail: z.string().email("Correo electronico invalido").transform(val => val === "" ? undefined : val).optional(),
  website: z.string().url("URL invalida").transform(val => val === "" ? undefined : val).optional(),
})

// Paso 3: Ubicación
export const clubLocationSchema = z.object({
  country: z.string().min(2, "El pais es requerido"),
  state: z.string().min(2, "El estado es requerido"),
  city: z.string().min(2, "La ciudad es requerida"),
  address: z.string().min(10, "La direccion debe tener al menos 10 caracteres"),
  postalCode: z.string().transform(val => val === "" ? undefined : val).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

// Paso 4: Instalaciones (sin refine)
const clubFacilitiesBase = z.object({
  indoorCourts: z.number().int().min(0),
  outdoorCourts: z.number().int().min(0),
  courtSurface: z.string().transform(val => val === "" ? undefined : val).optional(),
})

export const clubFacilitiesSchema = clubFacilitiesBase.refine(
  (data) => (data.indoorCourts + data.outdoorCourts) >= 1,
  {
    message: "El club debe tener al menos 1 cancha (interior o exterior)",
    path: ["indoorCourts"],
  }
)

// Paso 5: Servicios Adicionales
export const clubServicesSchema = z.object({
  hasParking: z.boolean().default(false),
  hasLockers: z.boolean().default(false),
  hasShowers: z.boolean().default(false),
  hasCafeteria: z.boolean().default(false),
  hasProShop: z.boolean().default(false),
  hasLighting: z.boolean().default(false),
  hasAirConditioning: z.boolean().default(false),
  operatingHours: z.string().transform(val => val === "" ? undefined : val).optional(),
  priceRange: z.string().transform(val => val === "" ? undefined : val).optional(),
  acceptsOnlineBooking: z.boolean().default(false),
  facebook: z.string().transform(val => val === "" ? undefined : val).optional(),
  instagram: z.string().transform(val => val === "" ? undefined : val).optional(),
})

// Schema completo para onboarding (todos los pasos combinados)
export const registerClubCompleteSchema = clubResponsibleSchema
  .merge(clubInfoSchema)
  .merge(clubLocationSchema)
  .merge(clubFacilitiesBase)
  .merge(clubServicesSchema)
  .extend({
    type: z.literal("club"),
  })
  .refine(
    (data) => (data.indoorCourts + data.outdoorCourts) >= 1,
    {
      message: "El club debe tener al menos 1 cancha (interior o exterior)",
      path: ["indoorCourts"],
    }
  )

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>
export type RegisterClubInitialInput = z.infer<typeof registerClubInitialSchema>
export type ClubResponsibleInput = z.infer<typeof clubResponsibleSchema>
export type ClubInfoInput = z.infer<typeof clubInfoSchema>
export type ClubLocationInput = z.infer<typeof clubLocationSchema>
export type ClubFacilitiesInput = z.infer<typeof clubFacilitiesSchema>
export type ClubServicesInput = z.infer<typeof clubServicesSchema>
export type RegisterClubCompleteInput = z.infer<typeof registerClubCompleteSchema>

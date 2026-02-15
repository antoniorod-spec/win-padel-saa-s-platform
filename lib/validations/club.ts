import { z } from "zod"

const scheduleSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
})

const dayScheduleSchema = z.object({
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  closed: z.boolean(),
  slots: z.array(scheduleSlotSchema),
}).refine((value) => (value.closed ? value.slots.length === 0 : value.slots.length > 0), {
  message: "Cada dia abierto debe tener al menos un bloque de horario",
})

export const updateClubSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(500).optional(),
  legalName: z.string().optional(),
  rfc: z.string().optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  neighborhood: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().or(z.literal("")).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  contactName: z.string().min(3).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  contactPosition: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  indoorCourts: z.number().int().min(0).optional(),
  outdoorCourts: z.number().int().min(0).optional(),
  courts: z.number().int().min(0).optional(),
  courtSurface: z.string().optional(),
  courtSurfaces: z.array(z.string()).optional(),
  hasParking: z.boolean().optional(),
  hasLockers: z.boolean().optional(),
  hasShowers: z.boolean().optional(),
  hasCafeteria: z.boolean().optional(),
  hasProShop: z.boolean().optional(),
  hasLighting: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  operatingHours: z.string().optional(),
  weeklySchedule: z.array(dayScheduleSchema).length(7).optional(),
  priceRange: z.string().optional(),
  acceptsOnlineBooking: z.boolean().optional(),
  services: z.array(z.string()).optional(),
  photos: z.array(z.string().url()).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  facebook: z.string().url().or(z.literal("")).optional(),
  instagram: z.string().url().or(z.literal("")).optional(),
  tiktok: z.string().url().or(z.literal("")).optional(),
  youtube: z.string().url().or(z.literal("")).optional(),
  linkedin: z.string().url().or(z.literal("")).optional(),
  x: z.string().url().or(z.literal("")).optional(),
  whatsapp: z.string().optional(),
})

export type UpdateClubInput = z.infer<typeof updateClubSchema>

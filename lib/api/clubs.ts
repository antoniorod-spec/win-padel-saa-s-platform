import { api } from "./client"

interface ClubListItem {
  id: string
  name: string
  city: string
  country: string
  courts: number
  rating: number
  logoUrl: string | null
  tournaments: number
  status: string
}

interface ClubDetail extends ClubListItem {
  legalName: string | null
  address: string | null
  state: string
  postalCode: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  contactName: string
  contactPhone: string
  contactEmail: string | null
  contactPosition: string | null
  indoorCourts: number
  outdoorCourts: number
  courtSurface: string | null
  courtSurfaces: string[] | null
  hasParking: boolean
  hasLockers: boolean
  hasShowers: boolean
  hasCafeteria: boolean
  hasProShop: boolean
  hasLighting: boolean
  hasAirConditioning: boolean
  operatingHours: string | null
  weeklySchedule: Array<{
    day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
    closed: boolean
    slots: Array<{ start: string; end: string }>
  }> | null
  priceRange: string | null
  acceptsOnlineBooking: boolean
  services: string[] | null
  photos: string[] | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  linkedin: string | null
  x: string | null
  whatsapp: string | null
  totalTournaments: number
  activeTournaments: Array<{
    id: string
    name: string
    startDate: string
    status: string
    category: string
    format: string
    inscriptionPrice: number | string
    modalities: Array<{
      id: string
      modality: string
      category: string
    }>
  }>
  news: ClubNews[]
}

export interface ClubNews {
  id: string
  clubId: string
  title: string
  content: string
  coverImageUrl: string | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ClubStats {
  totalTournaments: number
  activeTournaments: number
  totalRegistrations: number
  pendingPayments: number
  courts: number
  rating: number
}

export async function fetchClubs(params?: {
  city?: string
  status?: string
  search?: string
}) {
  return api.get<ClubListItem[]>("/clubs", params)
}

export async function fetchClub(id: string) {
  return api.get<ClubDetail>(`/clubs/${id}`)
}

export async function updateClub(id: string, data: Record<string, unknown>) {
  return api.put(`/clubs/${id}`, data)
}

export async function fetchMyClub() {
  return api.get<ClubDetail & { news?: ClubNews[] }>("/clubs/me")
}

export async function updateMyClub(data: Record<string, unknown>) {
  return api.put<ClubDetail>("/clubs/me", data)
}

export async function fetchClubTournaments(id: string, status?: string) {
  return api.get(`/clubs/${id}/tournaments`, { status })
}

export async function fetchClubStats(id: string) {
  return api.get<ClubStats>(`/clubs/${id}/stats`)
}

export async function fetchMyClubNews() {
  return api.get<ClubNews[]>("/clubs/me/news")
}

export async function createMyClubNews(data: {
  title: string
  content: string
  coverImageUrl?: string
  published?: boolean
}) {
  return api.post<ClubNews>("/clubs/me/news", data)
}

export async function updateMyClubNews(
  newsId: string,
  data: {
    title?: string
    content?: string
    coverImageUrl?: string
    published?: boolean
  }
) {
  return api.put<ClubNews>(`/clubs/me/news/${newsId}`, data)
}

export async function deleteMyClubNews(newsId: string) {
  return api.delete<null>(`/clubs/me/news/${newsId}`)
}

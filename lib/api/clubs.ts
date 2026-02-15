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
  address: string | null
  phone: string | null
  totalTournaments: number
  activeTournaments: Array<{
    id: string
    name: string
    startDate: string
    status: string
  }>
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

export async function fetchClubTournaments(id: string, status?: string) {
  return api.get(`/clubs/${id}/tournaments`, { status })
}

export async function fetchClubStats(id: string) {
  return api.get<ClubStats>(`/clubs/${id}/stats`)
}

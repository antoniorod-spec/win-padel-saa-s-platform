import { api } from "./client"
import type { PaginatedResponse } from "@/lib/types"

interface PlayerListItem {
  id: string
  firstName: string
  lastName: string
  fullName: string
  city: string
  country: string
  sex: string
  avatarUrl: string | null
  rankings: Array<{
    modality: string
    category: string
    points: number
    played: number
    wins: number
    losses: number
  }>
}

interface PlayerDetail {
  id: string
  firstName: string
  lastName: string
  fullName: string
  city: string
  country: string
  sex: string
  age: number | null
  avatarUrl: string | null
  rankings: Array<{
    id: string
    modality: string
    category: string
    points: number
    played: number
    wins: number
    losses: number
  }>
  categoryHistory: Array<{
    id: string
    modality: string
    fromCategory: string
    toCategory: string
    type: string
    status: string
    reason: string | null
    createdAt: string
  }>
}

interface PlayerStats {
  rankings: Array<{ modality: string; category: string; points: number }>
  totalTournaments: number
  totalMatches: number
  recentRegistrations: Array<{
    tournamentName: string
    modality: string
    category: string
    registeredAt: string
  }>
}

interface PlayerMatch {
  id: string
  tournament: string
  tournamentCategory: string
  round: string
  opponent: string
  scores: unknown
  result: "W" | "L" | "pending"
  playedAt: string | null
}

export async function fetchPlayers(params?: {
  city?: string
  modality?: string
  category?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  return api.get<PaginatedResponse<PlayerListItem>>("/players", params)
}

export async function fetchPlayer(id: string) {
  return api.get<PlayerDetail>(`/players/${id}`)
}

export async function updatePlayer(id: string, data: Record<string, unknown>) {
  return api.put(`/players/${id}`, data)
}

export async function fetchPlayerStats(id: string) {
  return api.get<PlayerStats>(`/players/${id}/stats`)
}

export async function fetchPlayerMatches(id: string, params?: {
  page?: number
  pageSize?: number
}) {
  return api.get<PaginatedResponse<PlayerMatch>>(`/players/${id}/matches`, params)
}

export async function fetchPlayerByPhone(phone: string) {
  return api.get<{ id: string; firstName: string; lastName: string } | null>(
    "/players/by-phone",
    { phone }
  )
}

export async function createPlayerFromPhone(data: {
  phone: string
  firstName: string
  lastName: string
  email?: string
  sex?: "M" | "F"
  suggestedCategory?: string
  sourceClubId?: string
}) {
  return api.post<{
    id: string
    firstName: string
    lastName: string
    phone: string | null
    created: boolean
  }>("/players/create-from-phone", data)
}

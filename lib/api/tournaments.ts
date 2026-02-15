import { api } from "./client"
import type { PaginatedResponse, BracketRound, GroupStanding } from "@/lib/types"

interface TournamentListItem {
  id: string
  name: string
  clubName: string
  city: string
  startDate: string
  endDate: string
  category: string
  format: string
  prize: string | null
  inscriptionPrice: number
  maxTeams: number
  status: string
  modalities: string[]
  registeredTeams: number
}

interface TournamentDetail {
  id: string
  name: string
  clubName: string
  city: string
  startDate: string
  endDate: string
  category: string
  format: string
  prize: string | null
  inscriptionPrice: number
  maxTeams: number
  status: string
  registeredTeams: number
  description: string | null
  clubId: string
  courts: number
  rules: Record<string, unknown> | null
  modalities: Array<{
    id: string
    modality: string
    category: string
    registeredTeams: number
    teams: Array<{
      registrationId: string
      seed: number | null
      player1: string
      player2: string
      paymentStatus: string
    }>
  }>
}

interface TeamInfo {
  registrationId: string
  seed: number | null
  player1: string
  player2: string
  player1Id: string
  player2Id: string
  combinedRanking: number
  modality: string
  category: string
  paymentStatus: string
}

export async function fetchTournaments(params?: {
  status?: string
  category?: string
  modality?: string
  city?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  return api.get<PaginatedResponse<TournamentListItem>>("/tournaments", params)
}

export async function fetchTournament(id: string) {
  return api.get<TournamentDetail>(`/tournaments/${id}`)
}

export async function createTournament(data: Record<string, unknown>) {
  return api.post<TournamentDetail>("/tournaments", data)
}

export async function updateTournament(id: string, data: Record<string, unknown>) {
  return api.put<TournamentDetail>(`/tournaments/${id}`, data)
}

export async function deleteTournament(id: string) {
  return api.delete(`/tournaments/${id}`)
}

export async function registerTeam(tournamentId: string, data: {
  tournamentModalityId: string
  player1Id: string
  player2Id: string
}) {
  return api.post(`/tournaments/${tournamentId}/register`, data)
}

export async function fetchBracket(tournamentId: string, modalityId?: string) {
  return api.get<{ rounds: BracketRound[] }>(`/tournaments/${tournamentId}/bracket`, {
    modalityId,
  })
}

export async function fetchGroups(tournamentId: string, modalityId?: string) {
  return api.get<{ groups: Array<{ group: string; teams: GroupStanding[] }> }>(
    `/tournaments/${tournamentId}/groups`,
    { modalityId }
  )
}

export async function fetchTeams(tournamentId: string, modalityId?: string) {
  return api.get<TeamInfo[]>(`/tournaments/${tournamentId}/teams`, { modalityId })
}

export async function generateBracket(tournamentId: string, modalityId: string) {
  return api.post(`/tournaments/${tournamentId}/generate-bracket`, { modalityId })
}

import { api } from "./client"
import type { PaginatedResponse, BracketRound, GroupStanding } from "@/lib/types"

interface TournamentListItem {
  id: string
  name: string
  clubId?: string
  clubName: string
  city: string
  state?: string | null
  country?: string | null
  startDate: string
  endDate: string
  category: string
  format: string
  type?: "FULL" | "BASIC"
  venue?: string | null
  registrationDeadline?: string | null
  externalRegistrationType?: "URL" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "OTHER" | null
  externalRegistrationLink?: string | null
  posterUrl?: string | null
  affectsRanking?: boolean
  resultsValidationStatus?: "NOT_REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  prize: string | null
  sponsorName?: string | null
  sponsorLogoUrl?: string | null
  logoUrl?: string | null
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
  type?: "FULL" | "BASIC"
  venue?: string | null
  registrationDeadline?: string | null
  externalRegistrationType?: "URL" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "OTHER" | null
  externalRegistrationLink?: string | null
  posterUrl?: string | null
  affectsRanking?: boolean
  resultsValidationStatus?: "NOT_REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  validationNotes?: string | null
  prize: string | null
  sponsorName?: string | null
  sponsorLogoUrl?: string | null
  logoUrl?: string | null
  inscriptionPrice: number
  maxTeams: number
  status: string
  registeredTeams: number
  description: string | null
  clubId: string
  courts: number
  rules: Record<string, unknown> | null
  images?: string[] | null
  news?: Array<{ title: string; body: string; publishedAt?: string }> | null
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

interface TournamentResultSubmission {
  id: string
  submissionType: "MANUAL" | "EXCEL"
  status: "NOT_REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
  fileName?: string | null
  validatedAt?: string | null
  validationNotes?: string | null
  rows: Array<{
    id: string
    modality: string
    category: string
    finalStage: string
    player1Id?: string | null
    player2Id?: string | null
    importedPlayer1Name?: string | null
    importedPlayer2Name?: string | null
  }>
}

export async function fetchTournaments(params?: {
  status?: string
  category?: string // tournament.category (A/B/C)
  modality?: string
  modalityCategories?: string
  city?: string
  state?: string
  cityKey?: string
  stateKey?: string
  clubId?: string
  tournamentClass?: "MAJOR" | "REGULAR" | "EXPRESS" | string
  type?: "FULL" | "BASIC" | string
  format?: string
  from?: string
  to?: string
  search?: string
  mine?: boolean
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

export interface TournamentFiltersOptions {
  states: string[]
  citiesByState: Record<string, string[]>
  stateLabels: Record<string, string>
  cityLabels: Record<string, string>
  citySlugToCityKeys: Record<string, string[]>
  citySlugLabels: Record<string, string>
  tournamentStatuses: string[]
  tournamentTypes: string[]
  tournamentFormats: string[]
  tournamentCategories: string[]
  modalities: string[]
  modalityCategories: string[]
  clubs: Array<{
    id: string
    name: string
    country: string
    state: string
    city: string
    stateKey: string
    cityKey: string
  }>
  dateMin: string | null
  dateMax: string | null
}

export async function fetchTournamentFiltersOptions(params?: { status?: string }) {
  return api.get<TournamentFiltersOptions>("/tournaments/filters", params)
}

export async function generateBracket(tournamentId: string, modalityId: string) {
  return api.post(`/tournaments/${tournamentId}/generate-bracket`, { modalityId })
}

export async function importTournamentFile(params: {
  tournamentId: string
  tournamentModalityId: string
  importType: "players" | "pairs"
  file: File
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  formData.append("tournamentModalityId", params.tournamentModalityId)
  formData.append("importType", params.importType)

  const response = await fetch(`/api/tournaments/${params.tournamentId}/import`, {
    method: "POST",
    body: formData,
  })

  return response.json()
}

export async function submitTournamentResultsManual(params: {
  tournamentId: string
  rows: Array<{
    modality: "VARONIL" | "FEMENIL" | "MIXTO"
    category: string
    finalStage: "CHAMPION" | "RUNNER_UP" | "SEMIFINAL" | "QUARTERFINAL" | "ROUND_OF_16" | "ROUND_OF_32" | "GROUP_STAGE"
    player1Id?: string
    player2Id?: string
    importedPlayer1Name?: string
    importedPlayer2Name?: string
  }>
  notes?: string
}) {
  return api.post<TournamentResultSubmission>(`/tournaments/${params.tournamentId}/results/manual`, {
    rows: params.rows,
    notes: params.notes,
  })
}

export async function importTournamentResultsFile(params: {
  tournamentId: string
  file: File
}) {
  const formData = new FormData()
  formData.append("file", params.file)
  const response = await fetch(`/api/tournaments/${params.tournamentId}/results/import`, {
    method: "POST",
    body: formData,
  })
  return response.json()
}

export async function fetchTournamentResultSubmissions(tournamentId: string) {
  return api.get<TournamentResultSubmission[]>(`/tournaments/${tournamentId}/results/submissions`)
}

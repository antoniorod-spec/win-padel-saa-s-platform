// ============================================================
// Shared Types for WhinPadel
// These types are used by both frontend and backend
// ============================================================

// Enum types (matching Prisma schema)
export type UserRole = "PLAYER" | "CLUB" | "ADMIN"
export type Sex = "M" | "F"
export type ClubStatus = "PENDING" | "APPROVED" | "REJECTED"
export type TournamentCategory = "ANUAL" | "OPEN" | "REGULAR" | "EXPRESS"
export type TournamentFormat = "ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS"
export type TournamentStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type Modality = "VARONIL" | "FEMENIL" | "MIXTO"
export type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "REFUNDED"
export type MatchWinner = "TEAM_A" | "TEAM_B" | "NONE"
export type CategoryChangeType = "ASCENSION" | "DESCENT"
export type CategoryChangeStatus = "PENDING" | "APPROVED" | "REJECTED"
export type TournamentType = "FULL" | "BASIC"
export type ExternalRegistrationType = "URL" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "OTHER"
export type ResultsValidationStatus = "NOT_REQUIRED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED"
export type ResultSubmissionType = "MANUAL" | "EXCEL"
export type ResultFinalStage =
  | "CHAMPION"
  | "RUNNER_UP"
  | "SEMIFINAL"
  | "QUARTERFINAL"
  | "ROUND_OF_16"
  | "ROUND_OF_32"
  | "GROUP_STAGE"
export type RankingScope = "CITY" | "NATIONAL"

// ============================================================
// API Response types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// Player types
// ============================================================

export interface PlayerProfile {
  id: string
  firstName: string
  lastName: string
  fullName: string
  city: string
  country: string
  sex: string
  age: number | null
  avatarUrl: string | null
  currentCategory: string
  currentModality: string
  points: number
  position: number
  totalInCategory: number
  winRate: number
  played: number
  wins: number
  losses: number
}

export interface RankingEntry {
  id: string
  playerId: string
  playerName: string
  city: string
  associationId?: string | null
  associationName?: string | null
  club: string
  points: number
  played: number
  wins: number
  losses: number
  winRate: number
  trend: "up" | "down" | "same"
  ascensionStreak: boolean
  position: number
}

// ============================================================
// Tournament types
// ============================================================

export interface TournamentListItem {
  id: string
  name: string
  clubName: string
  city: string
  startDate: string
  endDate: string
  category: string
  modalities: string[]
  type?: TournamentType
  externalRegistrationType?: ExternalRegistrationType | null
  externalRegistrationLink?: string | null
  registrationDeadline?: string | null
  registrationOpensAt?: string | null
  officialBall?: string | null
  supportWhatsApp?: string | null
  posterUrl?: string | null
  rulesPdfUrl?: string | null
  resultsValidationStatus?: ResultsValidationStatus
  registeredTeams: number
  maxTeams: number
  prize: string | null
  inscriptionPrice: number
  status: string
}

export interface TournamentDetail extends TournamentListItem {
  description: string | null
  format: string
  rules: Record<string, unknown> | null
  clubId: string
}

export interface BracketMatch {
  id: string
  teamA: {
    name: string
    seed: number | null
    score: number[]
    registrationId: string | null
  }
  teamB: {
    name: string
    seed: number | null
    score: number[]
    registrationId: string | null
  }
  winner: "A" | "B" | null
}

export interface BracketRound {
  name: string
  order: number
  matches: BracketMatch[]
}

export interface GroupStanding {
  teamName: string
  registrationId: string
  wins: number
  losses: number
  setsFor: number
  setsAgainst: number
  points: number
}

// ============================================================
// Points table
// ============================================================

export const POINTS_TABLE = {
  ANUAL: [
    { round: "Campeon", roundOrder: 7, points: 2000 },
    { round: "Subcampeon (Final)", roundOrder: 6, points: 1400 },
    { round: "Semifinalista", roundOrder: 5, points: 1000 },
    { round: "Cuartofinalista", roundOrder: 4, points: 600 },
    { round: "Octavos de final", roundOrder: 3, points: 350 },
    { round: "Dieciseisavos", roundOrder: 2, points: 200 },
    { round: "Fase de grupos", roundOrder: 1, points: 100 },
  ],
  OPEN: [
    { round: "Campeon", roundOrder: 7, points: 1000 },
    { round: "Subcampeon", roundOrder: 6, points: 700 },
    { round: "Semifinalista", roundOrder: 5, points: 500 },
    { round: "Cuartofinalista", roundOrder: 4, points: 300 },
    { round: "Octavos", roundOrder: 3, points: 175 },
    { round: "Fase de grupos", roundOrder: 1, points: 50 },
  ],
  REGULAR: [
    { round: "Campeon", roundOrder: 7, points: 500 },
    { round: "Subcampeon", roundOrder: 6, points: 350 },
    { round: "Semifinalista", roundOrder: 5, points: 225 },
    { round: "Cuartofinalista", roundOrder: 4, points: 125 },
    { round: "Fase de grupos", roundOrder: 1, points: 25 },
  ],
  EXPRESS: [
    { round: "Campeon", roundOrder: 7, points: 250 },
    { round: "Subcampeon", roundOrder: 6, points: 175 },
    { round: "Semifinalista", roundOrder: 5, points: 120 },
    { round: "Cuartofinalista", roundOrder: 4, points: 70 },
    { round: "Fase de grupos", roundOrder: 1, points: 10 },
  ],
} as const

export const CATEGORIES_BY_MODALITY: Record<string, string[]> = {
  VARONIL: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "Senior", "10U", "12U", "14U", "16U", "18U"],
  FEMENIL: ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "Senior", "10U", "12U", "14U", "16U", "18U"],
  MIXTO: ["A", "B", "C", "D"],
}

export const ASCENSION_RULES = [
  { rule: "Ganar un torneo", result: "Ascenso automatico inmediato" },
  { rule: "Llegar a la final en 2 torneos consecutivos", result: "Ascenso automatico" },
  { rule: "Semifinales en 3 de ultimos 5 torneos", result: "Revision por comite" },
  { rule: "Al ascender", result: "Puntos = 0 en nueva categoria" },
]

export const DESCENT_RULES = [
  { rule: "Eliminado en 1ra ronda en 5 torneos consecutivos", result: "Puede solicitar descenso" },
  { rule: "El comite revisa y aprueba/rechaza", result: "Si desciende: Puntos = 0 en categoria inferior" },
]

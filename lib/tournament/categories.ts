export const TOURNAMENT_CLASS_OPTIONS = ["A", "B", "C", "D"] as const
export type TournamentClass = (typeof TOURNAMENT_CLASS_OPTIONS)[number]

export const TOURNAMENT_CLASS_LABELS: Record<TournamentClass, string> = {
  A: "Mayor",
  B: "Regular",
  C: "Express",
  D: "Amistoso",
}

// Category labels used inside TournamentModality.category (competitive level / division).
export const COMPETITION_CATEGORIES = [
  "1ra",
  "2da",
  "3ra",
  "4ta",
  "5ta",
  "6ta",
  "Infantil",
  "Senior",
] as const
export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number]

export const MODALITY_OPTIONS = ["VARONIL", "FEMENIL", "MIXTO"] as const
export type TournamentModalityKind = (typeof MODALITY_OPTIONS)[number]

export function formatModalityLabel(modality: string, category: string) {
  return `${category} ${modality}`
}


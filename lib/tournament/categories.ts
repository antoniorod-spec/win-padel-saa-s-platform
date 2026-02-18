export const TOURNAMENT_CLASS_OPTIONS = ["ANUAL", "OPEN", "REGULAR", "EXPRESS"] as const
export type TournamentClass = (typeof TOURNAMENT_CLASS_OPTIONS)[number]

export const TOURNAMENT_CLASS_LABELS: Record<TournamentClass, string> = {
  ANUAL: "Anual",
  OPEN: "Open",
  REGULAR: "Regular",
  EXPRESS: "Express",
}

/** Puntos máximos (campeón) por nivel de torneo */
export const TOURNAMENT_CLASS_POINTS: Record<TournamentClass, number> = {
  ANUAL: 2000,
  OPEN: 1000,
  REGULAR: 500,
  EXPRESS: 250,
}

/** Clases CSS para badges por nivel (Tailwind) */
export const TOURNAMENT_CLASS_BADGE_CLASS: Record<TournamentClass, string> = {
  ANUAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  OPEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  REGULAR: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  EXPRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

/** Nombre del icono Lucide por nivel */
export const TOURNAMENT_CLASS_ICON: Record<TournamentClass, "Trophy" | "Medal" | "Target" | "Zap"> = {
  ANUAL: "Trophy",
  OPEN: "Medal",
  REGULAR: "Target",
  EXPRESS: "Zap",
}

// Categorías por modalidad (nivel competitivo / división)
// VARONIL/FEMENIL: 1ra-6ta, Senior, Infantil/Juvenil (10U-18U)
// MIXTO: A, B, C, D
export const CATEGORIES_VARONIL_FEMENIL = [
  "1ra",
  "2da",
  "3ra",
  "4ta",
  "5ta",
  "6ta",
  "Senior",
  "10U",
  "12U",
  "14U",
  "16U",
  "18U",
] as const
export const CATEGORIES_MIXTO = ["A", "B", "C", "D"] as const

/** Etiquetas para categorías Infantil/Juvenil (10U-18U son juveniles) */
export const CATEGORY_LABELS: Record<string, string> = {
  "10U": "10 y menores",
  "12U": "12 y menores",
  "14U": "14 y menores (Juvenil)",
  "16U": "16 y menores (Juvenil)",
  "18U": "18 y menores (Juvenil)",
}

/** @deprecated Usar getCategoriesForModality */
export const COMPETITION_CATEGORIES = [
  ...CATEGORIES_VARONIL_FEMENIL,
  ...CATEGORIES_MIXTO,
] as const
export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number]

export const MODALITY_OPTIONS = ["VARONIL", "FEMENIL", "MIXTO"] as const
export type TournamentModalityKind = (typeof MODALITY_OPTIONS)[number]

/** Obtiene las categorías válidas según la modalidad */
export function getCategoriesForModality(modality: string): readonly string[] {
  if (modality === "MIXTO") return CATEGORIES_MIXTO
  if (modality === "VARONIL" || modality === "FEMENIL") return CATEGORIES_VARONIL_FEMENIL
  return [...CATEGORIES_VARONIL_FEMENIL, ...CATEGORIES_MIXTO]
}

/** Etiqueta para mostrar (usa CATEGORY_LABELS si existe) */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

export function formatModalityLabel(modality: string, category: string) {
  return `${getCategoryLabel(category)} ${modality}`
}

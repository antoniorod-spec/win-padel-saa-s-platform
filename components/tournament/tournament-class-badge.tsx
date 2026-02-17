"use client"

import { Badge } from "@/components/ui/badge"
import {
  TOURNAMENT_CLASS_LABELS,
  TOURNAMENT_CLASS_POINTS,
  TOURNAMENT_CLASS_BADGE_CLASS,
  TOURNAMENT_CLASS_ICON,
  type TournamentClass,
} from "@/lib/tournament/categories"
import { Trophy, Medal, Target, Zap } from "lucide-react"

const ICONS = { Trophy, Medal, Target, Zap } as const

interface TournamentClassBadgeProps {
  category: string
  showPoints?: boolean
  size?: "sm" | "default"
}

const VALID_CLASSES = ["ANUAL", "OPEN", "REGULAR", "EXPRESS"] as const

/** Mapea categorías legacy (A,B,C,D) a las nuevas para compatibilidad */
function normalizeCategory(cat: string): TournamentClass {
  const m: Record<string, TournamentClass> = {
    A: "ANUAL",
    B: "OPEN",
    C: "REGULAR",
    D: "EXPRESS",
  }
  const out = m[cat] ?? cat
  return VALID_CLASSES.includes(out as (typeof VALID_CLASSES)[number]) ? (out as TournamentClass) : "REGULAR"
}

export function TournamentClassBadge({ category, showPoints = true, size = "default" }: TournamentClassBadgeProps) {
  if (!category?.trim()) {
    return <Badge variant="outline">Sin clase</Badge>
  }
  const c = normalizeCategory(category)
  const label = TOURNAMENT_CLASS_LABELS[c] ?? category
  const points = TOURNAMENT_CLASS_POINTS[c]
  const badgeClass = TOURNAMENT_CLASS_BADGE_CLASS[c] ?? ""
  const Icon = ICONS[TOURNAMENT_CLASS_ICON[c]] ?? Trophy

  return (
    <Badge className={`${badgeClass} ${size === "sm" ? "text-xs" : ""}`} variant="secondary">
      <span className="flex items-center gap-1.5">
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {label}
        {showPoints && points != null && ` (${points} pts)`}
      </span>
    </Badge>
  )
}

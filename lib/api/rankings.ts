import { api } from "./client"
import type { RankingEntry, POINTS_TABLE } from "@/lib/types"

export async function fetchRankings(params?: {
  modality?: string
  category?: string
  city?: string
  scope?: "CITY" | "NATIONAL"
  associationId?: string
}) {
  return api.get<RankingEntry[]>("/rankings", params)
}

export async function fetchPointsTable() {
  return api.get<typeof POINTS_TABLE>("/rankings/points-table")
}

export async function recalculateRankings() {
  return api.post("/rankings/recalculate")
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchRankings, fetchPointsTable, recalculateRankings } from "@/lib/api/rankings"

export function useRankings(
  modality: string = "VARONIL",
  category: string = "4ta",
  city?: string
) {
  return useQuery({
    queryKey: ["rankings", modality, category, city],
    queryFn: () => fetchRankings({ modality, category, city }),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function usePointsTable() {
  return useQuery({
    queryKey: ["pointsTable"],
    queryFn: () => fetchPointsTable(),
    staleTime: 5 * 60 * 1000, // 5 minutes (rarely changes)
  })
}

export function useRecalculateRankings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => recalculateRankings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rankings"] })
    },
  })
}

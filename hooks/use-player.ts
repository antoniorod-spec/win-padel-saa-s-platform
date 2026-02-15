import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchPlayer, fetchPlayerStats, fetchPlayerMatches, updatePlayer } from "@/lib/api/players"

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player", playerId],
    queryFn: () => fetchPlayer(playerId!),
    enabled: !!playerId,
  })
}

export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player", playerId, "stats"],
    queryFn: () => fetchPlayerStats(playerId!),
    enabled: !!playerId,
  })
}

export function usePlayerMatches(playerId: string | undefined, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["player", playerId, "matches", page, pageSize],
    queryFn: () => fetchPlayerMatches(playerId!, { page, pageSize }),
    enabled: !!playerId,
  })
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updatePlayer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["player", id] })
      queryClient.invalidateQueries({ queryKey: ["player", id, "stats"] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchClubs,
  fetchClub,
  updateClub,
  fetchClubTournaments,
  fetchClubStats,
} from "@/lib/api/clubs"
import { createTournament } from "@/lib/api/tournaments"

export function useClubs(params?: { city?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["clubs", params],
    queryFn: () => fetchClubs(params),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useClub(clubId: string | undefined) {
  return useQuery({
    queryKey: ["club", clubId],
    queryFn: () => fetchClub(clubId!),
    enabled: !!clubId,
  })
}

export function useClubStats(clubId: string | undefined) {
  return useQuery({
    queryKey: ["club", clubId, "stats"],
    queryFn: () => fetchClubStats(clubId!),
    enabled: !!clubId,
  })
}

export function useClubTournaments(clubId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ["club", clubId, "tournaments", status],
    queryFn: () => fetchClubTournaments(clubId!, status),
    enabled: !!clubId,
  })
}

export function useUpdateClub() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateClub(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["club", id] })
      queryClient.invalidateQueries({ queryKey: ["clubs"] })
    },
  })
}

export function useCreateTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTournament(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
      queryClient.invalidateQueries({ queryKey: ["club"] })
    },
  })
}

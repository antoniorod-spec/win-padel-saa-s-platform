import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchTournaments,
  fetchTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  registerTeam,
  fetchBracket,
  fetchGroups,
  fetchTeams,
  generateBracket,
} from "@/lib/api/tournaments"

export function useTournaments(params?: {
  status?: string
  category?: string
  modality?: string
  city?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["tournaments", params],
    queryFn: () => fetchTournaments(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchTournament(tournamentId!),
    enabled: !!tournamentId,
  })
}

export function useTournamentBracket(tournamentId: string | undefined, modalityId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "bracket", modalityId],
    queryFn: () => fetchBracket(tournamentId!, modalityId),
    enabled: !!tournamentId,
  })
}

export function useTournamentGroups(tournamentId: string | undefined, modalityId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "groups", modalityId],
    queryFn: () => fetchGroups(tournamentId!, modalityId),
    enabled: !!tournamentId,
  })
}

export function useTournamentTeams(tournamentId: string | undefined, modalityId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "teams", modalityId],
    queryFn: () => fetchTeams(tournamentId!, modalityId),
    enabled: !!tournamentId,
  })
}

export function useCreateTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createTournament(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
    },
  })
}

export function useUpdateTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateTournament(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] })
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
    },
  })
}

export function useDeleteTournament() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] })
    },
  })
}

export function useRegisterTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tournamentId,
      data,
    }: {
      tournamentId: string
      data: { tournamentModalityId: string; player1Id: string; player2Id: string }
    }) => registerTeam(tournamentId, data),
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "teams"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] })
    },
  })
}

export function useGenerateBracket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tournamentId, modalityId }: { tournamentId: string; modalityId: string }) =>
      generateBracket(tournamentId, modalityId),
    onSuccess: (_, { tournamentId, modalityId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "bracket", modalityId] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] })
    },
  })
}

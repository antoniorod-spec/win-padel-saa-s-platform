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
  fetchTournamentFiltersOptions,
  importTournamentFile,
  submitTournamentResultsManual,
  importTournamentResultsFile,
  fetchTournamentResultSubmissions,
} from "@/lib/api/tournaments"

export function useTournaments(params?: {
  status?: string
  category?: string
  modality?: string
  modalityCategories?: string
  city?: string
  state?: string
  cityKey?: string
  stateKey?: string
  clubId?: string
  tournamentClass?: string
  type?: string
  format?: string
  from?: string
  to?: string
  search?: string
  mine?: boolean
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["tournaments", params],
    queryFn: () => fetchTournaments(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useTournamentFiltersOptions(params?: { status?: string }) {
  return useQuery({
    queryKey: ["tournaments", "filters", params],
    queryFn: () => fetchTournamentFiltersOptions(params),
    staleTime: 60 * 1000,
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

export function useImportTournamentFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      tournamentId: string
      tournamentModalityId: string
      importType: "players" | "pairs"
      file: File
    }) => importTournamentFile(params),
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "teams"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] })
    },
  })
}

export function useTournamentResultSubmissions(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "result-submissions"],
    queryFn: () => fetchTournamentResultSubmissions(tournamentId!),
    enabled: !!tournamentId,
  })
}

export function useSubmitTournamentResultsManual() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
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
    }) => submitTournamentResultsManual(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "result-submissions"] })
    },
  })
}

export function useImportTournamentResultsFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tournamentId: string; file: File }) => importTournamentResultsFile(params),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "result-submissions"] })
    },
  })
}

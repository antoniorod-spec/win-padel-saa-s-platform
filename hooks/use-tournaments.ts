import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchTournaments,
  fetchTournament,
  createTournament,
  updateTournament,
  registerTeamManual,
  deleteTournamentRegistration,
  deleteTournament,
  registerTeam,
  fetchBracket,
  fetchGroups,
  fetchTeams,
  generateBracket,
  fetchTournamentFiltersOptions,
  validateImportTournamentFile,
  importTournamentFile,
  importValidatedRows,
  submitTournamentResultsManual,
  importTournamentResultsFile,
  fetchTournamentResultSubmissions,
  fetchTournamentCourts,
  createTournamentCourt,
  deleteTournamentCourt,
  setTournamentCourtAvailability,
  generateTournamentSlots,
  generateModalityGroups,
  fetchModalityGroups,
  generateTournamentSchedule,
  fetchTournamentSchedule,
  fetchTournamentSlots,
  generateMirrorBracket,
  fetchTournamentPublicSchedule,
  transitionTournamentStatus,
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

export function useTournamentPublicSchedule(tournamentId: string | undefined, modalityId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "public-schedule", modalityId],
    queryFn: () => fetchTournamentPublicSchedule(tournamentId!, { modalityId }),
    enabled: !!tournamentId,
    staleTime: 15 * 1000,
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

export function useTransitionTournamentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { tournamentId: string; status: string }) =>
      transitionTournamentStatus(params.tournamentId, params.status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId] })
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

export function useRegisterTeamManual() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tournamentId,
      data,
    }: {
      tournamentId: string
      data: Parameters<typeof registerTeamManual>[1]
    }) => registerTeamManual(tournamentId, data),
    onSuccess: (res, { tournamentId }) => {
      // Actualización inmediata: añadir pareja al caché sin esperar refetch
      const team = (res as { success?: boolean; team?: unknown })?.team
      if (team) {
        queryClient.setQueriesData(
          { queryKey: ["tournament", tournamentId, "teams"] },
          (prev: { data?: unknown[] } | undefined) => {
            if (!prev?.data || !Array.isArray(prev.data)) return prev
            return { ...prev, data: [...prev.data, team] }
          }
        )
      }
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "teams"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] })
    },
  })
}

export function useDeleteTournamentRegistration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tournamentId, registrationId }: { tournamentId: string; registrationId: string }) =>
      deleteTournamentRegistration(tournamentId, registrationId),
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

export function useTournamentCourts(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "courts"],
    queryFn: () => fetchTournamentCourts(tournamentId!),
    enabled: !!tournamentId,
  })
}

export function useTournamentSlots(tournamentId: string | undefined, params?: { date?: string; courtId?: string; status?: string }) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "slots", params],
    queryFn: () => fetchTournamentSlots(tournamentId!, params),
    enabled: !!tournamentId,
    staleTime: 10 * 1000,
  })
}

export function useTournamentSchedule(tournamentId: string | undefined, params?: { date?: string; courtId?: string; modalityId?: string }) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "schedule", params],
    queryFn: () => fetchTournamentSchedule(tournamentId!, params),
    enabled: !!tournamentId,
    staleTime: 10 * 1000,
  })
}

export function useTournamentModalityGroups(tournamentId: string | undefined, modalityId: string | undefined) {
  return useQuery({
    queryKey: ["tournament", tournamentId, "modality-groups", modalityId],
    queryFn: () => fetchModalityGroups(tournamentId!, modalityId!),
    enabled: !!tournamentId && !!modalityId,
  })
}

export function useCreateTournamentCourt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tournamentId: string; data: { name: string; venue: string; isIndoor?: boolean } }) =>
      createTournamentCourt(params.tournamentId, params.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "courts"] })
    },
  })
}

export function useDeleteTournamentCourt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tournamentId: string; courtId: string }) =>
      deleteTournamentCourt(params.tournamentId, params.courtId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "courts"] })
    },
  })
}

export function useSetTournamentCourtAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      tournamentId: string
      courtId: string
      availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string; specificDate?: string }>
    }) => setTournamentCourtAvailability(params.tournamentId, params.courtId, params.availabilities),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "courts"] })
    },
  })
}

export function useGenerateTournamentSlots() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tournamentId: string) => generateTournamentSlots(tournamentId),
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "courts"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "schedule"] })
    },
  })
}

export function useGenerateModalityGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tournamentId: string; modalityId: string }) =>
      generateModalityGroups(params.tournamentId, params.modalityId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId] })
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "groups", vars.modalityId] })
    },
  })
}

export function useGenerateTournamentSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tournamentId: string) => generateTournamentSchedule(tournamentId),
    onSuccess: (_, tournamentId) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "schedule"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "groups"] })
    },
  })
}

export function useGenerateMirrorBracket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { tournamentId: string; modalityId: string }) =>
      generateMirrorBracket(params.tournamentId, params.modalityId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", vars.tournamentId, "bracket", vars.modalityId] })
    },
  })
}

export function useValidateImportTournamentFile() {
  return useMutation({
    mutationFn: (params: {
      tournamentId: string
      tournamentModalityId?: string
      file: File
    }) => validateImportTournamentFile(params),
  })
}

export function useImportValidatedRows() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      tournamentId: string
      rows: Array<{ player1Id: string; player2Id: string; tournamentModalityId: string }>
    }) => importValidatedRows(params),
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId, "teams"] })
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] })
    },
  })
}

export function useImportTournamentFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      tournamentId: string
      tournamentModalityId?: string
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

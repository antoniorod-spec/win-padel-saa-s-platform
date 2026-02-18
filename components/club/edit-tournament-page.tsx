"use client"

import { useTournament } from "@/hooks/use-tournaments"
import { NewTournamentWizard } from "@/components/club/new-tournament-wizard"
import { TournamentEditForm } from "@/components/club/tournament-edit-form"
import { Loader2 } from "lucide-react"

interface EditTournamentPageProps {
  tournamentId: string
}

/**
 * Para torneos en DRAFT: usa el mismo wizard que la creación inicial (misma estructura, todo editable).
 * Para torneos publicados: usa el formulario de edición limitada.
 */
export function EditTournamentPage({ tournamentId }: EditTournamentPageProps) {
  const tournamentQuery = useTournament(tournamentId)

  if (tournamentQuery.isLoading || !tournamentQuery.data?.data) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = (tournamentQuery.data.data as { status?: string }).status ?? ""

  if (status === "DRAFT") {
    return <NewTournamentWizard initialTournamentId={tournamentId} />
  }

  return <TournamentEditForm tournamentId={tournamentId} />
}

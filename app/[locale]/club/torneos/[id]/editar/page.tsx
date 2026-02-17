import { TournamentEditForm } from "@/components/club/tournament-edit-form"

export default async function Page({
  params,
}: {
  params: Promise<{ locale?: string; id: string }>
}) {
  const { id } = await params
  return <TournamentEditForm tournamentId={id} />
}

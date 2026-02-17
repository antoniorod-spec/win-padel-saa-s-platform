import { TournamentAutomationClient } from "@/components/club/tournament-automation-client"

export default async function Page({
  params,
}: {
  params: Promise<{ locale?: string; id: string }>
}) {
  const { id } = await params
  return <TournamentAutomationClient tournamentId={id} />
}

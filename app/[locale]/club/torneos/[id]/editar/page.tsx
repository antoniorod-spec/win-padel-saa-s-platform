import { notFound } from "next/navigation"
import { EditTournamentPage } from "@/components/club/edit-tournament-page"

export default async function Page({
  params,
}: {
  params: Promise<{ locale?: string; id: string }>
}) {
  const { id } = await params
  if (!id) notFound()
  return <EditTournamentPage tournamentId={id} />
}

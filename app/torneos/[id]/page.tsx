"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { useLocale, useTranslations } from "next-intl"
import { TournamentBracket } from "@/components/tournament-bracket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useTournament, useTournamentBracket, useTournamentGroups, useTournamentTeams } from "@/hooks/use-tournaments"
import { useGenerateBracket } from "@/hooks/use-tournaments"
import { useTournamentPublicSchedule } from "@/hooks/use-tournaments"
import { RegisterTeamModal } from "@/components/modals/register-team-modal"
import { ImportTeamsModal } from "@/components/modals/import-teams-modal"
import { TournamentRegistrationStep } from "@/components/club/tournament-registration-step"
import { cn } from "@/lib/utils"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBetweenInclusive(day: Date, start: Date, end: Date) {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return d >= s && d <= e
}

function formatMonthTitle(date: Date, localeTag: string) {
  try {
    return date.toLocaleDateString(localeTag, { month: "long", year: "numeric" })
  } catch {
    return `${date.getMonth() + 1}/${date.getFullYear()}`
  }
}

export default function TournamentPage() {
  const locale = useLocale() as "es" | "en"
  const t = useTranslations("TournamentDetail")
  const localeTag = locale === "en" ? "en-US" : "es-MX"
  const params = useParams()
  const tournamentId = params.id as string
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isRegistrationManageOpen, setIsRegistrationManageOpen] = useState(false)
  const [isPosterOpen, setIsPosterOpen] = useState(false)
  const [selectedModalityId, setSelectedModalityId] = useState<string>("")
  const [calendarMonth, setCalendarMonth] = useState<Date | null>(null)

  const { data: tournamentData, isLoading } = useTournament(tournamentId)
  const { data: bracketData } = useTournamentBracket(tournamentId)
  const { data: groupsData, isLoading: isGroupsLoading } = useTournamentGroups(
    tournamentId,
    selectedModalityId || undefined
  )
  const { data: teamsData } = useTournamentTeams(tournamentId)
  const { data: scheduleData, isLoading: scheduleLoading } = useTournamentPublicSchedule(
    tournamentId,
    selectedModalityId || undefined
  )
  const generateBracket = useGenerateBracket()

  // IMPORTANT: all hooks (useMemo/useEffect) must run BEFORE any early returns.
  const tournament = tournamentData?.data
  const bracket = bracketData?.data
  const teams = teamsData?.data || []
  const groups = groupsData?.data?.groups ?? []
  const scheduleMatches = (scheduleData as any)?.data ?? []

  const tournamentStart = useMemo(() => {
    if (!tournament?.startDate) return null
    return new Date(tournament.startDate)
  }, [tournament?.startDate])

  const tournamentEnd = useMemo(() => {
    if (!tournament?.endDate) return null
    return new Date(tournament.endDate)
  }, [tournament?.endDate])

  useEffect(() => {
    if (!tournament) return
    if (selectedModalityId) return
    const first = Array.isArray(tournament.modalities) ? tournament.modalities[0]?.id : null
    if (first) setSelectedModalityId(first)
  }, [tournament, selectedModalityId])

  useEffect(() => {
    if (calendarMonth) return
    if (!tournamentStart) return
    setCalendarMonth(startOfMonth(tournamentStart))
  }, [calendarMonth, tournamentStart])

  const effectiveMonth = useMemo(() => {
    // Keep this ALWAYS a Date to avoid hook-order workarounds and TS null checks.
    if (calendarMonth) return calendarMonth
    if (tournamentStart) return startOfMonth(tournamentStart)
    return startOfMonth(new Date())
  }, [calendarMonth, tournamentStart])

  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(effectiveMonth)
    const startWeekday = monthStart.getDay() // 0=Sun
    const gridStart = new Date(monthStart)
    gridStart.setDate(monthStart.getDate() - startWeekday)
    const cells: Array<{ date: Date; inCurrentMonth: boolean }> = []
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      cells.push({ date: d, inCurrentMonth: d.getMonth() === monthStart.getMonth() })
    }
    return cells
  }, [effectiveMonth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">{t("loading")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">{t("notFound")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const isRegistrationOpen = tournament.status === "OPEN"
  const isAlmostFull = tournament.registeredTeams >= tournament.maxTeams * 0.9
  const tournamentStartDate = tournamentStart ?? new Date(tournament.startDate)
  const tournamentEndDate = tournamentEnd ?? new Date(tournament.endDate)
  const posterUrl =
    (typeof (tournament as any)?.posterUrl === "string" && (tournament as any).posterUrl.trim()
      ? (tournament as any).posterUrl.trim()
      : null) ||
    (Array.isArray((tournament as any)?.images) && typeof (tournament as any).images[0] === "string"
      ? (tournament as any).images[0]
      : null) ||
    (typeof (tournament as any)?.clubLogoUrl === "string" && (tournament as any).clubLogoUrl.trim()
      ? (tournament as any).clubLogoUrl.trim()
      : null) ||
    null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative border-b border-border bg-card">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary">Cat. {tournament.category}</Badge>
                  {tournament.type === "BASIC" ? (
                    <Badge variant="outline">{t("basicTournament")}</Badge>
                  ) : null}
                  {isRegistrationOpen && (
                    <Badge variant="secondary">{t("registrationOpen")}</Badge>
                  )}
                  {isAlmostFull && (
                    <Badge className="bg-destructive/10 text-destructive">{t("almostFull")}</Badge>
                  )}
                  {tournament.status === "ACTIVE" && (
                    <Badge className="bg-chart-4/10 text-chart-4">{t("inProgress")}</Badge>
                  )}
                  {tournament.status === "COMPLETED" && (
                    <Badge className="bg-muted text-muted-foreground">{t("completed")}</Badge>
                  )}
                  {tournament.resultsValidationStatus === "PENDING_REVIEW" ? (
                    <Badge variant="outline">{t("resultsPendingReview")}</Badge>
                  ) : null}
                  {tournament.resultsValidationStatus === "APPROVED" ? (
                    <Badge className="bg-primary/10 text-primary">{t("resultsApproved")}</Badge>
                  ) : null}
                </div>
                <h1 className="mt-3 font-display text-3xl font-black uppercase text-card-foreground md:text-4xl lg:text-5xl">
                  {tournament.name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{tournament.clubName}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(tournament.startDate).toLocaleDateString(localeTag)} - {new Date(tournament.endDate).toLocaleDateString(localeTag)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {tournament.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {tournament.registeredTeams}/{tournament.maxTeams} {t("teams")}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    {tournament.prize ? (
                      <>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{t("totalPrize")}</p>
                        <p className="font-display text-2xl font-bold text-primary">{tournament.prize}</p>
                        <Separator className="my-2" />
                      </>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {t("inscriptionPrice", { price: tournament.inscriptionPrice })}
                    </p>
                  </CardContent>
                </Card>

                {posterUrl ? (
                  <Dialog open={isPosterOpen} onOpenChange={setIsPosterOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        {t("viewPoster")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl p-0">
                      <div className="bg-black">
                        <DialogHeader className="sr-only">
                          <DialogTitle>{t("posterDialogTitle")}</DialogTitle>
                        </DialogHeader>
                        <img
                          src={posterUrl}
                          alt={`Cartel ${tournament.name}`}
                          className="max-h-[80vh] w-full object-contain"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src = "/demo/covers/default.svg"
                          }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : null}

                {isRegistrationOpen && tournament.type !== "BASIC" && (
                  <Button
                    size="lg" 
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    <Trophy className="h-4 w-4" />
                    {t("registerNow")}
                  </Button>
                )}
                {tournament.type === "BASIC" && tournament.externalRegistrationLink ? (
                  <a href={tournament.externalRegistrationLink} target="_blank" rel="noreferrer" className="w-full">
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Trophy className="h-4 w-4" />
                      {t("goToExternalRegistration")}
                    </Button>
                  </a>
                ) : null}
                {tournament.type !== "BASIC" ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsRegistrationManageOpen(true)}
                    >
                      {t("manageRegistrations")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsImportModalOpen(true)}
                    >
                      {t("importTeams")}
                    </Button>
                  </>
                ) : null}
                {tournament.type !== "BASIC" && tournament.modalities?.[0] && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      generateBracket.mutate({
                        tournamentId,
                        modalityId: tournament.modalities[0].id,
                      })
                    }
                  >
                    {t("generateBrackets")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs defaultValue="teams">
            <TabsList className="mb-6 flex w-full justify-start gap-6 overflow-x-auto rounded-none bg-transparent p-0 border-b border-border/60">
              {bracket && tournament.type !== "BASIC" ? <TabsTrigger value="bracket">{t("tabs.bracket")}</TabsTrigger> : null}
              <TabsTrigger value="teams">{t("tabs.teams")}</TabsTrigger>
              <TabsTrigger value="calendar">{t("tabs.calendar")}</TabsTrigger>
              <TabsTrigger value="schedule">{t("tabs.schedule")}</TabsTrigger>
              <TabsTrigger value="groups">{t("tabs.groups")}</TabsTrigger>
              <TabsTrigger value="info">{t("tabs.info")}</TabsTrigger>
            </TabsList>

            {bracket && (
              <TabsContent value="bracket">
                <Card className="border-border/50">
                  <CardContent className="overflow-x-auto p-4 lg:p-6">
                    <TournamentBracket 
                      rounds={bracket.rounds} 
                      tournamentName={tournament.name} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="teams">
              <Card className="border-border/50">
                <CardContent className="p-0">
                  {teams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Users className="mb-4 h-16 w-16 text-muted-foreground/40" />
                      <p className="text-lg font-medium text-muted-foreground">
                          {t("noTeamsTitle")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                          {t("noTeamsSubtitle")}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Seed</TableHead>
                            <TableHead>{t("table.team")}</TableHead>
                            <TableHead>{t("table.modality")}</TableHead>
                            <TableHead className="text-center">{t("table.paymentStatus")}</TableHead>
                            <TableHead className="text-right">{t("table.combinedRanking")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams.map((team: any) => (
                          <TableRow key={team.registrationId}>
                            <TableCell>
                              {team.seed ? (
                                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${team.seed <= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {team.seed}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {team.player1} / {team.player2}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {team.category} {team.modality}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  team.paymentStatus === "PAID"
                                    ? "border-primary text-primary"
                                    : team.paymentStatus === "PENDING"
                                      ? "border-yellow-500 text-yellow-500"
                                      : "border-destructive text-destructive"
                                }
                              >
                                {team.paymentStatus === "PAID"
                                  ? t("payment.paid")
                                  : team.paymentStatus === "PENDING"
                                    ? t("payment.pending")
                                    : t("payment.unpaid")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-display font-bold text-primary">
                              {team.combinedRanking ? `${team.combinedRanking.toLocaleString(localeTag)} ${t("pointsShort")}` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card className="border-border/50">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                      <CardTitle className="font-display text-lg text-card-foreground">{t("calendar.title")}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(tournament.startDate).toLocaleDateString(localeTag)} - {new Date(tournament.endDate).toLocaleDateString(localeTag)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setCalendarMonth(addMonths(effectiveMonth, -1))}
                      disabled={monthKey(effectiveMonth) <= monthKey(startOfMonth(tournamentStartDate))}
                      title={t("calendar.prevMonth")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCalendarMonth(startOfMonth(tournamentStartDate))}
                      className="px-4 text-xs font-bold uppercase tracking-wider"
                      title={t("calendar.goToStart")}
                    >
                      {t("calendar.start")}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setCalendarMonth(addMonths(effectiveMonth, 1))}
                      disabled={monthKey(effectiveMonth) >= monthKey(startOfMonth(tournamentEndDate))}
                      title={t("calendar.nextMonth")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-black uppercase tracking-wide text-card-foreground">
                      {formatMonthTitle(effectiveMonth, localeTag)}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded bg-primary" />
                        {t("calendar.legendTournamentDays")}
                      </div>
                      {tournament.registrationDeadline ? (
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded bg-slate-900" />
                          {t("calendar.legendRegistrationDeadline")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                    <div className="grid grid-cols-7 border-b border-border/60 bg-muted/40">
                      {(locale === "en"
                        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                        : ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
                      ).map((d) => (
                        <div
                          key={d}
                          className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {calendarCells.map((cell) => {
                        const inTournamentRange = isBetweenInclusive(cell.date, tournamentStartDate, tournamentEndDate)
                        const isRegistrationDeadline =
                          tournament.registrationDeadline &&
                          isSameDay(cell.date, new Date(tournament.registrationDeadline))
                        return (
                          <div
                            key={cell.date.toISOString()}
                            className={cn(
                              "min-h-[110px] border-b border-r border-border/40 p-2 text-xs",
                              // last column
                              cell.date.getDay() === 6 ? "border-r-0" : "",
                              !cell.inCurrentMonth ? "text-muted-foreground/40" : "text-card-foreground",
                              inTournamentRange ? "bg-primary/5" : "",
                              isRegistrationDeadline ? "bg-slate-900/5" : ""
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={cn("text-sm font-semibold", !cell.inCurrentMonth ? "opacity-50" : "")}>
                                {cell.date.getDate()}
                              </span>
                              {inTournamentRange ? (
                                <span className="mt-1 h-2 w-2 rounded bg-primary" title={t("calendar.tooltipTournamentDay")} />
                              ) : isRegistrationDeadline ? (
                                <span className="mt-1 h-2 w-2 rounded bg-slate-900" title={t("calendar.tooltipRegistrationDeadline")} />
                              ) : null}
                            </div>
                            {inTournamentRange ? (
                              <div className="mt-2 rounded bg-primary px-2 py-1 text-[10px] font-black uppercase text-primary-foreground">
                                {tournament.name}
                              </div>
                            ) : isRegistrationDeadline ? (
                              <div className="mt-2 rounded bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-white">
                                {t("calendar.registrationDeadline")}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">{t("schedule.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {scheduleLoading ? (
                    <p className="text-sm text-muted-foreground">{t("schedule.loading")}</p>
                  ) : Array.isArray(scheduleMatches) && scheduleMatches.length > 0 ? (
                    Object.entries(
                      scheduleMatches.reduce((acc: Record<string, any[]>, m: any) => {
                        const day = m?.slot?.date ? String(m.slot.date).slice(0, 10) : "sin-fecha"
                        acc[day] = acc[day] ?? []
                        acc[day].push(m)
                        return acc
                      }, {})
                    )
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([day, matches]) => (
                        <div key={day} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-card-foreground">
                              {day !== "sin-fecha" ? new Date(day).toLocaleDateString(localeTag) : t("schedule.unknownDate")}
                            </p>
                            <Badge variant="outline">{matches.length} {t("schedule.matches")}</Badge>
                          </div>
                          <div className="rounded-lg border border-border/50">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t("scheduleTable.time")}</TableHead>
                                  <TableHead>{t("scheduleTable.court")}</TableHead>
                                  <TableHead>{t("scheduleTable.match")}</TableHead>
                                  <TableHead className="text-right">{t("scheduleTable.modality")}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {matches.map((m: any) => {
                                  const a = m.teamARegistration
                                  const b = m.teamBRegistration
                                  const aName = a
                                    ? `${a.player1.firstName} ${a.player1.lastName} / ${a.player2.firstName} ${a.player2.lastName}`
                                    : "TBD"
                                  const bName = b
                                    ? `${b.player1.firstName} ${b.player1.lastName} / ${b.player2.firstName} ${b.player2.lastName}`
                                    : "TBD"
                                  const time = m?.slot ? `${m.slot.startTime}-${m.slot.endTime}` : "-"
                                  const court = m?.slot?.court ? `${m.slot.court.venue} - ${m.slot.court.name}` : (m.court || "-")
                                  const mod = m?.tournamentModality ? `${m.tournamentModality.modality} ${m.tournamentModality.category}` : "-"
                                  return (
                                    <TableRow key={m.id}>
                                      <TableCell className="font-medium">{time}</TableCell>
                                      <TableCell>{court}</TableCell>
                                      <TableCell className="text-sm">{aName} vs {bName}</TableCell>
                                      <TableCell className="text-right">{mod}</TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("schedule.empty")}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-display text-xl font-black uppercase tracking-wide text-card-foreground">
                      Fase de grupos
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Tabla calculada con partidos de fase de grupos (roundOrder=1).
                    </p>
                  </div>

                  {Array.isArray(tournament.modalities) && tournament.modalities.length > 1 ? (
                    <div className="w-full md:w-[320px]">
                      <Select value={selectedModalityId || tournament.modalities[0]?.id} onValueChange={setSelectedModalityId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournament.modalities.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.category} {m.modality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>

                <Card className="border-border/50">
                  <CardContent className="p-0">
                    {isGroupsLoading ? (
                      <div className="p-6">
                        <p className="text-sm text-muted-foreground">Cargando grupos...</p>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="p-6">
                        <p className="text-sm text-muted-foreground">
                          No hay grupos disponibles aún. Se muestran cuando existan partidos de fase de grupos para esta modalidad.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 p-4 md:grid-cols-2">
                        {groups.map((g) => (
                          <Card key={g.group} className="border-border/60">
                            <CardHeader className="pb-3">
                              <CardTitle className="font-display text-base font-black uppercase tracking-wide">
                                {g.group}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">#</TableHead>
                                      <TableHead>Pareja</TableHead>
                                      <TableHead className="text-center">PJ</TableHead>
                                      <TableHead className="text-center">W</TableHead>
                                      <TableHead className="text-center">L</TableHead>
                                      <TableHead className="text-center">Sets</TableHead>
                                      <TableHead className="text-right">Pts</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {g.teams.map((t, idx) => {
                                      const pos = idx + 1
                                      const played = (t.wins ?? 0) + (t.losses ?? 0)
                                      const diff = (t.setsFor ?? 0) - (t.setsAgainst ?? 0)
                                      return (
                                        <TableRow key={t.registrationId}>
                                          <TableCell>
                                            <span
                                              className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                                                pos === 1
                                                  ? "bg-yellow-400 text-slate-900"
                                                  : pos === 2
                                                    ? "bg-slate-300 text-slate-900"
                                                    : pos === 3
                                                      ? "bg-orange-400 text-slate-900"
                                                      : "bg-muted text-muted-foreground"
                                              )}
                                            >
                                              {pos}
                                            </span>
                                          </TableCell>
                                          <TableCell className="font-medium text-foreground">{t.teamName}</TableCell>
                                          <TableCell className="text-center">{played}</TableCell>
                                          <TableCell className="text-center">{t.wins}</TableCell>
                                          <TableCell className="text-center">{t.losses}</TableCell>
                                          <TableCell className="text-center text-muted-foreground">
                                            {t.setsFor}-{t.setsAgainst} ({diff >= 0 ? `+${diff}` : diff})
                                          </TableCell>
                                          <TableCell className="text-right font-display font-bold text-primary">
                                            {t.points}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="info">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg text-card-foreground">
                      Información General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { 
                        icon: Calendar, 
                        label: "Fechas", 
                        value: `${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}` 
                      },
                      { 
                        icon: MapPin, 
                        label: "Sede", 
                        value: `${tournament.venue || tournament.clubName}, ${tournament.city}` 
                      },
                      { 
                        icon: Trophy, 
                        label: "Formato", 
                        value: tournament.format 
                      },
                      { 
                        icon: BarChart3, 
                        label: "Categoría", 
                        value: `Torneo Categoría ${tournament.category}` 
                      },
                      { 
                        icon: Clock, 
                        label: "Canchas", 
                        value: `${tournament.courts} canchas disponibles` 
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm text-card-foreground">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg text-card-foreground">
                      Premios y Reglas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tournament.prize && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Premio Total
                          </p>
                          <p className="text-sm text-card-foreground">{tournament.prize}</p>
                        </div>
                      </div>
                    )}
                    {tournament.sponsorName && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Patrocinador
                          </p>
                          <p className="text-sm text-card-foreground">{tournament.sponsorName}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Inscripción
                        </p>
                        <p className="text-sm text-card-foreground">
                          ${tournament.inscriptionPrice} MXN por pareja
                        </p>
                      </div>
                    </div>
                    {tournament.description && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Descripción
                          </p>
                          <p className="text-sm text-card-foreground">{tournament.description}</p>
                        </div>
                      </div>
                    )}
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                        Modalidades
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tournament.modalities.map((m: any) => (
                          <Badge key={m.id} variant="secondary">
                            {m.category} {m.modality} ({m.registeredTeams} equipos)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />

      {/* Registration Modal */}
      <RegisterTeamModal
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        tournamentId={tournamentId}
        modalities={tournament.modalities}
      />
      <ImportTeamsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        tournamentId={tournamentId}
        modalities={tournament.modalities}
      />

      <Dialog open={isRegistrationManageOpen} onOpenChange={setIsRegistrationManageOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("manageRegistrations")}</DialogTitle>
          </DialogHeader>
          <TournamentRegistrationStep
            tournamentId={tournamentId}
            modalities={tournament.modalities}
            clubId={tournament.clubId}
            maxTeams={tournament.maxTeams}
            showImportExcel
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

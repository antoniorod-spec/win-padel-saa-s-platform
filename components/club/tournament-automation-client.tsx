"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  useGenerateMirrorBracket,
  useGenerateModalityGroups,
  useGenerateTournamentSchedule,
  useGenerateTournamentSlots,
  useTournament,
  useTournamentBracket,
  useTournamentCourts,
  useTournamentModalityGroups,
  useTournamentSchedule,
} from "@/hooks/use-tournaments"
import { Trophy, CalendarDays, Grid3X3, Users, ArrowLeft, UserPlus } from "lucide-react"
import { TournamentRegistrationStep } from "@/components/club/tournament-registration-step"
import { cn } from "@/lib/utils"
import { TournamentBracket } from "@/components/tournament-bracket"

export function TournamentAutomationClient({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const tournament = useTournament(tournamentId)
  const courts = useTournamentCourts(tournamentId)
  const generateSlots = useGenerateTournamentSlots()
  const generateGroups = useGenerateModalityGroups()
  const generateSchedule = useGenerateTournamentSchedule()
  const generateMirror = useGenerateMirrorBracket()

  const modalities = (tournament.data?.data?.modalities ?? []) as Array<{ id: string; modality: string; category: string; registeredTeams?: number }>

  const [selectedModalityId, setSelectedModalityId] = useState<string>("")
  useEffect(() => {
    if (selectedModalityId) return
    if (modalities.length > 0) setSelectedModalityId(modalities[0].id)
  }, [modalities, selectedModalityId])

  const groupsQuery = useTournamentModalityGroups(tournamentId, selectedModalityId || undefined)
  const bracketQuery = useTournamentBracket(tournamentId, selectedModalityId || undefined)
  const scheduleQuery = useTournamentSchedule(tournamentId, selectedModalityId ? { modalityId: selectedModalityId } : undefined)

  const scheduleByDay = useMemo(() => {
    const matches = Array.isArray(scheduleQuery.data?.data) ? scheduleQuery.data?.data : []
    const map = new Map<string, any[]>()
    for (const m of matches) {
      const date = m?.slot?.date ? new Date(m.slot.date).toISOString().slice(0, 10) : "sin-fecha"
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [scheduleQuery.data?.data])

  async function handleGenerateSlots() {
    try {
      const res = await generateSlots.mutateAsync(tournamentId)
      if (!res?.success) throw new Error(res?.error || "No se pudieron generar slots")
      toast({ title: "Slots generados" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al generar slots", variant: "destructive" })
    }
  }

  async function handleGenerateGroups() {
    if (!selectedModalityId) return
    try {
      const res = await generateGroups.mutateAsync({ tournamentId, modalityId: selectedModalityId })
      if (!res?.success) throw new Error(res?.error || "No se pudieron generar grupos")
      toast({ title: "Grupos generados" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al generar grupos", variant: "destructive" })
    }
  }

  async function handleGenerateSchedule() {
    try {
      const res = await generateSchedule.mutateAsync(tournamentId)
      if (!res?.success) throw new Error(res?.error || "No se pudo generar rol de juegos")
      toast({ title: "Rol de juegos generado" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al generar rol", variant: "destructive" })
    }
  }

  async function handleGenerateEliminations() {
    if (!selectedModalityId) return
    try {
      const res = await generateMirror.mutateAsync({ tournamentId, modalityId: selectedModalityId })
      if (!res?.success) throw new Error(res?.error || "No se pudo generar eliminatoria")
      toast({ title: "Eliminatoria generada" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error al generar eliminatoria", variant: "destructive" })
    }
  }

  const summary = useMemo(() => {
    const totalTeams = modalities.reduce((sum, m) => sum + (m.registeredTeams ?? 0), 0)
    const courtsCount = (courts.data?.data ?? []).length
    const groupsCount = Array.isArray(groupsQuery.data?.data) ? groupsQuery.data?.data.length : 0
    const matchesCount = Array.isArray(scheduleQuery.data?.data) ? scheduleQuery.data?.data.length : 0
    return { totalTeams, courtsCount, groupsCount, matchesCount }
  }, [modalities, courts.data?.data, groupsQuery.data?.data, scheduleQuery.data?.data])

  const selectedModLabel = useMemo(() => {
    const m = modalities.find((x) => x.id === selectedModalityId)
    return m ? `${m.modality} ${m.category}` : "Selecciona modalidad"
  }, [modalities, selectedModalityId])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-black tracking-tight">Automatizacion de torneo</h1>
          <p className="text-sm text-muted-foreground">
            Genera slots, grupos, rol de juegos y eliminatorias para cada categoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push({ pathname: "/club", query: { section: "torneos" } } as any)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button variant="outline" onClick={handleGenerateSlots} disabled={generateSlots.isPending}>
            Generar slots
          </Button>
          <Button variant="outline" onClick={handleGenerateGroups} disabled={!selectedModalityId || generateGroups.isPending}>
            Generar grupos
          </Button>
          <Button variant="outline" onClick={handleGenerateSchedule} disabled={generateSchedule.isPending}>
            Generar rol
          </Button>
          <Button className="bg-primary text-primary-foreground" onClick={handleGenerateEliminations} disabled={!selectedModalityId || generateMirror.isPending}>
            Generar eliminatoria
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {tournament.data?.data?.name ?? "Torneo"}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">Clase {tournament.data?.data?.category ?? "-"}</Badge>
                <Badge variant="outline">{tournament.data?.data?.format ?? "-"}</Badge>
                <Badge variant="outline">{tournament.data?.data?.status ?? "-"}</Badge>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <Select value={selectedModalityId} onValueChange={setSelectedModalityId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecciona modalidad" />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.modality} {m.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">Vista actual: {selectedModLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Parejas</p>
              <p className="text-lg font-bold">{summary.totalTeams}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Grid3X3 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Grupos</p>
              <p className="text-lg font-bold">{summary.groupsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Partidos asignados</p>
              <p className="text-lg font-bold">{summary.matchesCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Canchas</p>
              <p className="text-lg font-bold">{summary.courtsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inscripciones" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inscripciones" className="gap-1">
            <UserPlus className="h-3.5 w-3.5" />
            Inscripciones
          </TabsTrigger>
          <TabsTrigger value="grupos">Fase de grupos</TabsTrigger>
          <TabsTrigger value="eliminatoria">Fase eliminatoria</TabsTrigger>
          <TabsTrigger value="rol">Rol de juegos</TabsTrigger>
        </TabsList>

        <TabsContent value="inscripciones">
          <TournamentRegistrationStep
            tournamentId={tournamentId}
            modalities={modalities}
            clubId={(tournament.data?.data as any)?.clubId}
            maxTeams={(tournament.data?.data as any)?.maxTeams ?? 64}
            showImportExcel
          />
        </TabsContent>

        <TabsContent value="grupos">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-base font-black uppercase tracking-wide">Grupos</CardTitle>
                <Button variant="outline" onClick={handleGenerateGroups} disabled={!selectedModalityId || generateGroups.isPending}>
                  Regenerar grupos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (Array.isArray(groupsQuery.data?.data) ? groupsQuery.data?.data : []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no hay grupos para esta modalidad.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {(groupsQuery.data?.data as any[]).map((g: any) => (
                    <Card key={g.id} className="border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-black uppercase tracking-wide">
                          Grupo {g.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-14">Seed</TableHead>
                                <TableHead>Pareja</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(g.placements ?? []).map((p: any) => {
                                const r = p.registration
                                const p1 = r?.player1 ? `${r.player1.firstName} ${r.player1.lastName}` : "TBD"
                                const p2 = r?.player2 ? `${r.player2.firstName} ${r.player2.lastName}` : "TBD"
                                return (
                                  <TableRow key={p.id}>
                                    <TableCell>
                                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black",
                                        p.seed && p.seed <= 4 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                      )}>
                                        {p.seed ?? "-"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                      {p1} / {p2}
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
        </TabsContent>

        <TabsContent value="eliminatoria">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-base font-black uppercase tracking-wide">Eliminatoria</CardTitle>
                <Button className="bg-primary text-primary-foreground" onClick={handleGenerateEliminations} disabled={!selectedModalityId || generateMirror.isPending}>
                  Regenerar cruces
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bracketQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando cuadro...</p>
              ) : (bracketQuery.data?.data?.rounds ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no hay eliminatoria generada para esta modalidad.</p>
              ) : (
                <TournamentBracket
                  rounds={bracketQuery.data!.data!.rounds}
                  tournamentName={tournament.data?.data?.name ?? "Torneo"}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rol">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-base font-black uppercase tracking-wide">Rol de juegos</CardTitle>
                <Button variant="outline" onClick={handleGenerateSchedule} disabled={generateSchedule.isPending}>
                  Regenerar rol
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduleQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : scheduleByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no hay partidos asignados a slots.</p>
              ) : (
                scheduleByDay.map(([day, matches]) => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {day !== "sin-fecha" ? new Date(day).toLocaleDateString() : "Sin fecha"}
                      </p>
                      <Badge variant="outline">{matches.length} partidos</Badge>
                    </div>
                    <div className="rounded-lg border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hora</TableHead>
                            <TableHead>Cancha</TableHead>
                            <TableHead>Partido</TableHead>
                            <TableHead className="text-right">Categoria</TableHead>
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
                            const court = m?.slot?.court ? `${m.slot.court.venue} - ${m.slot.court.name}` : "-"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

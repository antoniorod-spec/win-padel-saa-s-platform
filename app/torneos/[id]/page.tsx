"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/landing/footer"
import { TournamentBracket } from "@/components/tournament-bracket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { useTournament, useTournamentBracket, useTournamentTeams } from "@/hooks/use-tournaments"
import { RegisterTeamModal } from "@/components/modals/register-team-modal"

export default function TournamentPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)

  const { data: tournamentData, isLoading } = useTournament(tournamentId)
  const { data: bracketData } = useTournamentBracket(tournamentId)
  const { data: teamsData } = useTournamentTeams(tournamentId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Cargando torneo...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!tournamentData?.data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Torneo no encontrado</p>
        </main>
        <Footer />
      </div>
    )
  }

  const tournament = tournamentData.data
  const bracket = bracketData?.data
  const teams = teamsData?.data || []

  const isRegistrationOpen = tournament.status === "UPCOMING" || tournament.status === "REGISTRATION_OPEN"
  const isAlmostFull = tournament.registeredTeams >= tournament.maxTeams * 0.9

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
                  {isRegistrationOpen && (
                    <Badge variant="secondary">Inscripciones abiertas</Badge>
                  )}
                  {isAlmostFull && (
                    <Badge className="bg-destructive/10 text-destructive">Casi lleno</Badge>
                  )}
                  {tournament.status === "ACTIVE" && (
                    <Badge className="bg-chart-4/10 text-chart-4">En curso</Badge>
                  )}
                  {tournament.status === "COMPLETED" && (
                    <Badge className="bg-muted text-muted-foreground">Finalizado</Badge>
                  )}
                </div>
                <h1 className="mt-3 font-display text-3xl font-black uppercase text-card-foreground md:text-4xl lg:text-5xl">
                  {tournament.name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{tournament.clubName}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {tournament.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {tournament.registeredTeams}/{tournament.maxTeams} parejas
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    {tournament.prize ? (
                      <>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Premio Total</p>
                        <p className="font-display text-2xl font-bold text-primary">{tournament.prize}</p>
                        <Separator className="my-2" />
                      </>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Inscripción: ${tournament.inscriptionPrice} MXN
                    </p>
                  </CardContent>
                </Card>
                {isRegistrationOpen && (
                  <Button 
                    size="lg" 
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    <Trophy className="h-4 w-4" />
                    Inscribirme Ahora
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs defaultValue="teams">
            <TabsList className="mb-6">
              {bracket && <TabsTrigger value="bracket">Cuadro / Bracket</TabsTrigger>}
              <TabsTrigger value="teams">Parejas Inscritas</TabsTrigger>
              <TabsTrigger value="info">Info del Torneo</TabsTrigger>
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
                        No hay parejas inscritas aún
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        Sé el primero en inscribirte
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Seed</TableHead>
                          <TableHead>Pareja</TableHead>
                          <TableHead>Modalidad</TableHead>
                          <TableHead className="text-center">Estado Pago</TableHead>
                          <TableHead className="text-right">Ranking Combinado</TableHead>
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
                                {team.paymentStatus === "PAID" ? "Pagado" : team.paymentStatus === "PENDING" ? "Pendiente" : "No pagado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-display font-bold text-primary">
                              {team.combinedRanking ? `${team.combinedRanking.toLocaleString()} pts` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
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
                        value: `${tournament.clubName}, ${tournament.city}` 
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
    </div>
  )
}

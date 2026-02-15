"use client"

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
import { sampleBracket } from "@/lib/mock-data"

const tournamentInfo = {
  name: "Open SLP 2026",
  club: "Advantage Padel",
  city: "San Luis Potosi",
  dates: "15-17 Marzo 2026",
  category: "A",
  format: "Fase de grupos + Eliminacion directa",
  prize: "$50,000 MXN",
  inscription: "$800 MXN por pareja",
  teams: 48,
  maxTeams: 64,
  courts: 12,
  modalities: ["Varonil 1ra", "Varonil 2da", "Varonil 3ra", "Femenil 1ra", "Femenil 2da"],
  rules: "Mejor de 3 sets, 6 games, Tie-break a 7 puntos, Golden Point activado",
}

const inscribedTeams = [
  { seed: 1, p1: "Carlos Mendoza", p2: "Alejandro Ruiz", ranking: 4850 + 4620, club: "Advantage Padel" },
  { seed: 2, p1: "Pablo Hernandez", p2: "Fernando Lopez", ranking: 3870 + 4380, club: "Advantage Padel" },
  { seed: 3, p1: "Roberto Sanchez", p2: "Miguel A. Torres", ranking: 4250 + 4100, club: "Loma Golf" },
  { seed: 4, p1: "Diego Martinez", p2: "Andres Gutierrez", ranking: 4510 + 3980, club: "Loma Golf" },
  { seed: 5, p1: "Eduardo Castillo", p2: "Javier Ramirez", ranking: 3640 + 3750, club: "Loma Golf" },
  { seed: 6, p1: "Omar Fuentes", p2: "Ricardo Solis", ranking: 3400 + 3300, club: "Marietta Padel" },
  { seed: 7, p1: "Jorge Vega", p2: "Marco Diaz", ranking: 3200 + 3100, club: "Marietta Padel" },
  { seed: 8, p1: "Luis Paredes", p2: "Pedro Castano", ranking: 2900 + 2850, club: "Advantage Padel" },
]

const groupStandings = [
  { group: "Grupo A", teams: [
    { name: "Mendoza / Ruiz", w: 3, l: 0, sf: 6, sc: 1, pts: 9 },
    { name: "Fuentes / Solis", w: 2, l: 1, sf: 5, sc: 3, pts: 6 },
    { name: "Team Moreno", w: 1, l: 2, sf: 3, sc: 5, pts: 3 },
    { name: "Team Garcia", w: 0, l: 3, sf: 1, sc: 6, pts: 0 },
  ]},
  { group: "Grupo B", teams: [
    { name: "Hernandez / Lopez", w: 3, l: 0, sf: 6, sc: 2, pts: 9 },
    { name: "Vega / Diaz", w: 2, l: 1, sf: 4, sc: 3, pts: 6 },
    { name: "Team Rojas", w: 1, l: 2, sf: 3, sc: 4, pts: 3 },
    { name: "Team Ibarra", w: 0, l: 3, sf: 2, sc: 6, pts: 0 },
  ]},
]

export default function TournamentPage() {
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
                  <Badge className="bg-primary/10 text-primary">Cat. {tournamentInfo.category}</Badge>
                  <Badge variant="secondary">Inscripciones abiertas</Badge>
                </div>
                <h1 className="mt-3 font-display text-3xl font-black uppercase text-card-foreground md:text-4xl lg:text-5xl">
                  {tournamentInfo.name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{tournamentInfo.club}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" />{tournamentInfo.dates}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{tournamentInfo.city}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{tournamentInfo.teams}/{tournamentInfo.maxTeams} parejas</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Premio Total</p>
                    <p className="font-display text-2xl font-bold text-primary">{tournamentInfo.prize}</p>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground">Inscripcion: {tournamentInfo.inscription}</p>
                  </CardContent>
                </Card>
                <Button size="lg" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Trophy className="h-4 w-4" />
                  Inscribirme Ahora
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <Tabs defaultValue="bracket">
            <TabsList className="mb-6">
              <TabsTrigger value="bracket">Cuadro / Bracket</TabsTrigger>
              <TabsTrigger value="groups">Fase de Grupos</TabsTrigger>
              <TabsTrigger value="teams">Parejas Inscritas</TabsTrigger>
              <TabsTrigger value="info">Info del Torneo</TabsTrigger>
            </TabsList>

            <TabsContent value="bracket">
              <Card className="border-border/50">
                <CardContent className="overflow-x-auto p-4 lg:p-6">
                  <TournamentBracket rounds={sampleBracket.rounds} tournamentName={sampleBracket.tournamentName} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups">
              <div className="grid gap-4 md:grid-cols-2">
                {groupStandings.map((group) => (
                  <Card key={group.group} className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-lg text-card-foreground">{group.group}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pareja</TableHead>
                            <TableHead className="text-center">W</TableHead>
                            <TableHead className="text-center">L</TableHead>
                            <TableHead className="text-center">SF</TableHead>
                            <TableHead className="text-center">SC</TableHead>
                            <TableHead className="text-center">Pts</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.teams.map((team, idx) => (
                            <TableRow key={team.name} className={idx < 2 ? "bg-primary/5" : ""}>
                              <TableCell className="font-medium text-card-foreground">
                                <div className="flex items-center gap-2">
                                  {idx < 2 && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                  {team.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-primary font-semibold">{team.w}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{team.l}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{team.sf}</TableCell>
                              <TableCell className="text-center text-muted-foreground">{team.sc}</TableCell>
                              <TableCell className="text-center font-bold text-card-foreground">{team.pts}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="teams">
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Seed</TableHead>
                        <TableHead>Pareja</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead className="text-right">Ranking Combinado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inscribedTeams.map((team) => (
                        <TableRow key={team.seed}>
                          <TableCell>
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${team.seed <= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {team.seed}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {team.p1} / {team.p2}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{team.club}</TableCell>
                          <TableCell className="text-right font-display font-bold text-primary">
                            {team.ranking.toLocaleString()} pts
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg text-card-foreground">Informacion General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Calendar, label: "Fechas", value: tournamentInfo.dates },
                      { icon: MapPin, label: "Sede", value: `${tournamentInfo.club}, ${tournamentInfo.city}` },
                      { icon: Trophy, label: "Formato", value: tournamentInfo.format },
                      { icon: BarChart3, label: "Categoria", value: `Torneo Categoria ${tournamentInfo.category} (Major)` },
                      { icon: Clock, label: "Canchas", value: `${tournamentInfo.courts} canchas disponibles` },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{item.label}</p>
                          <p className="text-sm text-card-foreground">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg text-card-foreground">Premios y Reglas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: DollarSign, label: "Premio Total", value: tournamentInfo.prize },
                      { icon: DollarSign, label: "Inscripcion", value: tournamentInfo.inscription },
                      { icon: Award, label: "Reglas", value: tournamentInfo.rules },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{item.label}</p>
                          <p className="text-sm text-card-foreground">{item.value}</p>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Modalidades</p>
                      <div className="flex flex-wrap gap-2">
                        {tournamentInfo.modalities.map((m) => (
                          <Badge key={m} variant="secondary">{m}</Badge>
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
    </div>
  )
}

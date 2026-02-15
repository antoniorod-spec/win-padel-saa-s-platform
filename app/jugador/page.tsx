"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Trophy,
  Search,
  BarChart3,
  Calendar,
  Newspaper,
  User,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUpCircle,
  Zap,
} from "lucide-react"
import { varonil4ta, playerProfileExample, playerStats, upcomingTournaments } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/jugador" },
  { label: "Mis Torneos", icon: Trophy, href: "/jugador" },
  { label: "Explorar Torneos", icon: Search, href: "/torneos" },
  { label: "Mi Ranking", icon: BarChart3, href: "/jugador" },
  { label: "Calendario", icon: Calendar, href: "/jugador" },
  { label: "Explorar Jugadores", icon: User, href: "/ranking" },
  { label: "Noticias", icon: Newspaper, href: "/jugador" },
]

const player = varonil4ta[0] // Ricardo Solis - lider de 4ta
const profile = playerProfileExample // Ruben Lara - ejemplo de ascenso

const myUpcomingMatches = [
  { id: 1, opponent: "Omar Fuentes / Raul Mendez", tournament: "Open SLP 2026", round: "Semifinal", date: "16 Mar 2026", time: "14:00", court: "Cancha 3" },
  { id: 2, opponent: "Por definir", tournament: "Open SLP 2026", round: "Final", date: "17 Mar 2026", time: "18:00", court: "Cancha Central" },
]

export default function PlayerDashboard() {
  return (
    <DashboardShell
      title="Mi Perfil"
      subtitle={`${player.name} - ${player.club}`}
      navItems={navItems}
      activeItem="Dashboard"
      role="jugador"
    >
      {/* Profile header */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
                RS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-card-foreground">{player.name}</h2>
                  {player.ascensionStreak && (
                    <Badge className="gap-1 bg-chart-4/10 text-chart-4 text-[10px]">
                      <Zap className="h-3 w-3" /> Racha de ascenso
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{player.club} - {player.city}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary">Categoria actual: 4ta Varonil</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-primary">#1</p>
                <p className="text-xs text-muted-foreground">Pos. en 4ta</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-card-foreground">{player.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Puntos en cat.</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-card-foreground">{player.winRate}%</p>
                <p className="text-xs text-muted-foreground">Victorias</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Partidos Jugados" value={player.played} icon={Trophy} />
        <StatCard title="Victorias" value={player.wins} icon={TrendingUp} trend="up" trendValue="3" />
        <StatCard title="Derrotas" value={player.losses} icon={BarChart3} />
        <StatCard title="Posicion Ranking" value="#1 de 25" icon={BarChart3} subtitle="4ta Categoria - Varonil" />
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="matches">Proximos Partidos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="categoryHistory">Historial Categorias</TabsTrigger>
          <TabsTrigger value="tournaments">Torneos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Ranking evolution chart - current category */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolucion de Puntos (4ta Varonil)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={playerStats.monthlyPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))",
                        }}
                      />
                      <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent matches */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  Ultimos Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playerStats.recentMatches.map((match, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">vs {match.opponent}</p>
                        <p className="text-xs text-muted-foreground">{match.tournament} - {match.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">{match.score}</span>
                        <Badge className={match.result === "W" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                          {match.result === "W" ? "Victoria" : "Derrota"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <div className="space-y-3">
            {myUpcomingMatches.map((match) => (
              <Card key={match.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-card-foreground">vs {match.opponent}</h4>
                      <p className="text-xs text-muted-foreground">{match.tournament} - {match.round}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{match.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{match.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{match.court}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-chart-4/10 text-chart-4">Proximo</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="space-y-3">
                {[
                  { name: "Open SLP 2026", result: "Campeon", points: "+1000", category: "A", catJugador: "4ta" },
                  { name: "Copa Marietta Elite", result: "Subcampeon", points: "+500", category: "B", catJugador: "4ta" },
                  { name: "Loma Golf Masters", result: "Semifinalista", points: "+500", category: "A", catJugador: "4ta" },
                  { name: "Express Advantage Weekend", result: "Campeon", points: "+400", category: "C", catJugador: "4ta" },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary">
                        Cat. {t.category}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.result} - Jugando en {t.catJugador}</p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-primary">{t.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category history tab - uses Ruben Lara's profile example */}
        <TabsContent value="categoryHistory" className="mt-4">
          <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Ejemplo de perfil: <span className="font-medium text-foreground">{profile.name}</span> - muestra historial de ascenso de 6ta a 4ta con resets de puntos.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Category info card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <ArrowUpCircle className="h-5 w-5 text-primary" />
                  Historial de Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg bg-primary/5 p-3">
                  <p className="text-sm font-medium text-card-foreground">
                    Categoria actual: <span className="text-primary">{profile.currentCategory} {profile.modality}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Puntos en categoria actual: {profile.currentPoints} pts (Posicion #{profile.currentPosition} de {profile.totalInCategory})
                  </p>
                </div>

                {/* Category timeline */}
                <div className="relative ml-4 border-l-2 border-border pl-6">
                  {profile.categoryHistory.map((cat, idx) => (
                    <div key={idx} className="relative mb-6 last:mb-0">
                      <div className={cn(
                        "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full",
                        idx === profile.categoryHistory.length - 1 ? "bg-primary" : "bg-muted"
                      )}>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          idx === profile.categoryHistory.length - 1 ? "bg-primary-foreground" : "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            idx === profile.categoryHistory.length - 1 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {cat.cat}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{cat.from} - {cat.to}</span>
                        </div>
                        {cat.reason && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                            <ArrowUpCircle className="h-3 w-3" /> Ascenso: {cat.reason}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Max puntos: {cat.maxPoints} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Points evolution chart with ascension resets */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolucion de Puntos ({profile.name})
                </CardTitle>
                <p className="text-xs text-muted-foreground">Los puntos se reinician a 0 al ascender de categoria</p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profile.pointsEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-30} textAnchor="end" height={50} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))",
                        }}
                        formatter={(value: number, name: string, props: { payload?: { category?: string } }) => [
                          `${value} pts`,
                          `Categoria ${props.payload?.category ?? ""}`,
                        ]}
                      />
                      {/* Ascension markers */}
                      <ReferenceLine x="Jun 25" stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Ascenso a 5ta", fill: "hsl(var(--primary))", fontSize: 10, position: "top" }} />
                      <ReferenceLine x="Nov 25" stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Ascenso a 4ta", fill: "hsl(var(--primary))", fontSize: 10, position: "top" }} />
                      <Line type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-4">
          <div className="space-y-3">
            {upcomingTournaments.map((t) => (
              <Card key={t.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-card-foreground">{t.name}</h4>
                        <Badge variant="outline" className="text-[10px]">Cat. {t.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{t.club}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.city}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-primary">{t.prize}</span>
                    <Link href={`/torneos/${t.id}`}>
                      <Button size="sm" className="bg-primary text-primary-foreground">Inscribirme</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

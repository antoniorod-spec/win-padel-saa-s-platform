"use client"

import { useSession } from "next-auth/react"
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
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePlayer, usePlayerStats, usePlayerMatches } from "@/hooks/use-player"
import { useTournaments } from "@/hooks/use-tournaments"
import { useEffect, useState } from "react"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/jugador" },
  { label: "Mis Torneos", icon: Trophy, href: "/jugador" },
  { label: "Explorar Torneos", icon: Search, href: "/torneos" },
  { label: "Mi Ranking", icon: BarChart3, href: "/jugador" },
  { label: "Calendario", icon: Calendar, href: "/jugador" },
  { label: "Explorar Jugadores", icon: User, href: "/ranking" },
  { label: "Noticias", icon: Newspaper, href: "/jugador" },
]

export default function PlayerDashboard() {
  const { data: session, status } = useSession()
  const [playerId, setPlayerId] = useState<string | undefined>(undefined)

  // Get playerId from userId
  useEffect(() => {
    const fetchPlayerId = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/players?userId=${session.user.id}`)
          const data = await response.json()
          if (data.success && data.data.data && data.data.data.length > 0) {
            setPlayerId(data.data.data[0].id)
          }
        } catch (error) {
          console.error("Error fetching playerId:", error)
        }
      }
    }
    fetchPlayerId()
  }, [session?.user?.id])

  const { data: playerData, isLoading: playerLoading } = usePlayer(playerId)
  const { data: statsData, isLoading: statsLoading } = usePlayerStats(playerId)
  const { data: matchesData, isLoading: matchesLoading } = usePlayerMatches(playerId, 1, 5)
  const { data: tournamentsData } = useTournaments({ status: "UPCOMING", pageSize: 5 })

  if (status === "loading" || playerLoading) {
    return (
      <DashboardShell
        title="Mi Perfil"
        subtitle="Cargando..."
        navItems={navItems}
        activeItem="Dashboard"
        role="jugador"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando perfil...</div>
        </div>
      </DashboardShell>
    )
  }

  if (!playerData || !statsData) {
    return (
      <DashboardShell
        title="Mi Perfil"
        subtitle="Error"
        navItems={navItems}
        activeItem="Dashboard"
        role="jugador"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No se pudo cargar el perfil del jugador</div>
        </div>
      </DashboardShell>
    )
  }

  const player = playerData.data
  const stats = statsData.data
  
  // Get primary ranking (first one or find VARONIL)
  const primaryRanking = player.rankings.find((r: any) => r.modality === "VARONIL") || player.rankings[0]
  const initials = `${player.firstName[0]}${player.lastName[0]}`.toUpperCase()
  
  // Calculate win rate from primary ranking
  const winRate = primaryRanking?.played > 0 
    ? Math.round((primaryRanking.wins / primaryRanking.played) * 100) 
    : 0

  return (
    <DashboardShell
      title="Mi Perfil"
      subtitle={`${player.fullName} - ${player.city}`}
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
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-card-foreground">{player.fullName}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{player.city}, {player.country}</p>
                {primaryRanking && (
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary">
                      Categoria actual: {primaryRanking.category} {primaryRanking.modality}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {primaryRanking && (
                <>
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-primary">{primaryRanking.points}</p>
                    <p className="text-xs text-muted-foreground">Puntos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-card-foreground">{winRate}%</p>
                    <p className="text-xs text-muted-foreground">Victorias</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Torneos Jugados" 
          value={stats.totalTournaments.toString()} 
          icon={Trophy} 
        />
        <StatCard 
          title="Partidos Jugados" 
          value={stats.totalMatches.toString()} 
          icon={BarChart3} 
        />
        {primaryRanking && (
          <>
            <StatCard 
              title="Victorias" 
              value={primaryRanking.wins} 
              icon={TrendingUp} 
            />
            <StatCard 
              title="Derrotas" 
              value={primaryRanking.losses} 
              icon={BarChart3} 
            />
          </>
        )}
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="rankings">Mis Rankings</TabsTrigger>
          <TabsTrigger value="categoryHistory">Historial Categorias</TabsTrigger>
          <TabsTrigger value="tournaments">Torneos Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Rankings card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Mis Rankings Actuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {player.rankings.map((ranking: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                          {ranking.category} {ranking.modality}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ranking.wins}W - {ranking.losses}L ({ranking.played} partidos)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-primary">{ranking.points}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                  ))}
                  {player.rankings.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay rankings disponibles aún</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent registrations */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  Inscripciones Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentRegistrations.map((reg: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">{reg.tournamentName}</p>
                        <p className="text-xs text-muted-foreground">
                          {reg.category} {reg.modality}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                  {stats.recentRegistrations.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay inscripciones recientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="space-y-4">
                {player.rankings.map((ranking: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-card-foreground">
                          {ranking.category} {ranking.modality}
                        </h3>
                        <p className="text-sm text-muted-foreground">Ranking ID: {ranking.id}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary text-lg px-3 py-1">
                        {ranking.points} pts
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Jugados</p>
                        <p className="text-xl font-bold text-card-foreground">{ranking.played}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Victorias</p>
                        <p className="text-xl font-bold text-primary">{ranking.wins}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Derrotas</p>
                        <p className="text-xl font-bold text-destructive">{ranking.losses}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {player.rankings.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No tienes rankings activos aún</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Inscríbete a un torneo para comenzar
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categoryHistory" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <ArrowUpCircle className="h-5 w-5 text-primary" />
                Historial de Cambios de Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.categoryHistory && player.categoryHistory.length > 0 ? (
                <div className="relative ml-4 border-l-2 border-border pl-6">
                  {player.categoryHistory.map((change: any, idx: number) => (
                    <div key={change.id} className="relative mb-6 last:mb-0">
                      <div className={cn(
                        "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full",
                        idx === 0 ? "bg-primary" : "bg-muted"
                      )}>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          idx === 0 ? "bg-primary-foreground" : "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn(
                            idx === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {change.fromCategory} → {change.toCategory}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {change.modality}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              change.status === "APPROVED" && "border-primary text-primary",
                              change.status === "PENDING" && "border-yellow-500 text-yellow-500",
                              change.status === "REJECTED" && "border-destructive text-destructive"
                            )}
                          >
                            {change.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {change.type} • {new Date(change.createdAt).toLocaleDateString()}
                        </p>
                        {change.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Razón: {change.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay historial de cambios de categoría</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-4">
          <div className="space-y-3">
            {tournamentsData?.data.data.map((t: any) => (
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
                        <span>{t.clubName}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.city}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-primary">
                      ${t.inscriptionPrice}
                    </span>
                    <Link href={`/torneos/${t.id}`}>
                      <Button size="sm" className="bg-primary text-primary-foreground">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!tournamentsData || tournamentsData.data.data.length === 0) && (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No hay torneos disponibles en este momento</p>
                  <Link href="/torneos">
                    <Button className="mt-4" variant="outline">
                      Explorar todos los torneos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Building2,
  Users,
  Trophy,
  Settings,
  FileText,
  BarChart3,
  AlertTriangle,
  Check,
  X,
  Newspaper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  useAdminStats, 
  usePendingClubs, 
  useCategoryReviews, 
  useRankingStats,
  useApproveClub, 
  useReviewCategoryChange 
} from "@/hooks/use-admin"
import { ascensionRules, descentRules } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Clubes", icon: Building2, href: "/admin" },
  { label: "Jugadores", icon: Users, href: "/admin" },
  { label: "Torneos", icon: Trophy, href: "/admin" },
  { label: "Comite Categorias", icon: AlertTriangle, href: "/admin" },
  { label: "Ranking Config", icon: BarChart3, href: "/admin" },
  { label: "Reportes", icon: FileText, href: "/admin" },
  { label: "Noticias", icon: Newspaper, href: "/admin" },
  { label: "Configuracion", icon: Settings, href: "/admin" },
]

export default function AdminDashboard() {
  const { toast } = useToast()
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const { data: clubsData } = usePendingClubs()
  const { data: categoryReviewsData } = useCategoryReviews("PENDING")
  const { data: rankingStatsData } = useRankingStats()
  
  const approveClubMutation = useApproveClub()
  const reviewCategoryMutation = useReviewCategoryChange()

  const stats = statsData?.data
  const pendingClubs = clubsData?.data || []
  const categoryReviews = categoryReviewsData?.data || []
  const rankingStats = rankingStatsData?.data || []

  const handleApproveClub = async (clubId: string, action: "approve" | "reject") => {
    try {
      await approveClubMutation.mutateAsync({ clubId, action })
      toast({
        title: action === "approve" ? "Club aprobado" : "Club rechazado",
        description: `El club ha sido ${action === "approve" ? "aprobado" : "rechazado"} exitosamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      })
    }
  }

  const handleReviewCategory = async (changeId: string, action: "approve" | "reject") => {
    try {
      await reviewCategoryMutation.mutateAsync({ changeId, action })
      toast({
        title: action === "approve" ? "Cambio aprobado" : "Cambio rechazado",
        description: `El cambio de categoría ha sido ${action === "approve" ? "aprobado" : "rechazado"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      })
    }
  }

  if (statsLoading) {
    return (
      <DashboardShell
        title="Panel de Administracion"
        subtitle="Gestion global de la plataforma WhinPadel"
        navItems={navItems}
        activeItem="Dashboard"
        role="admin"
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Panel de Administracion"
      subtitle="Gestion global de la plataforma WhinPadel"
      navItems={navItems}
      activeItem="Dashboard"
      role="admin"
    >
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Clubes" 
          value={stats?.totalClubs || 0} 
          icon={Building2} 
        />
        <StatCard 
          title="Jugadores Activos" 
          value={(stats?.activePlayers || 0).toLocaleString()} 
          icon={Users} 
        />
        <StatCard 
          title="Torneos Activos" 
          value={stats?.activeTournaments || 0} 
          icon={Trophy} 
        />
        <StatCard 
          title="Inscripciones" 
          value={(stats?.totalRegistrations || 0).toLocaleString()} 
          icon={BarChart3} 
        />
      </div>

      {/* Tabs for management */}
      <Tabs defaultValue="categories" className="mt-6">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Comite Categorias
            {categoryReviews.length > 0 && (
              <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-destructive/80 p-0 px-1.5 text-[10px] text-destructive-foreground">
                {categoryReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rankingConfig" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Ranking Config
          </TabsTrigger>
          <TabsTrigger value="clubs" className="gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Clubes
            {pendingClubs.length > 0 && (
              <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-primary p-0 px-1.5 text-[10px] text-primary-foreground">
                {pendingClubs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card className="mt-4 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Revisiones de Ascenso / Descenso
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Al aprobar un ascenso, los puntos del jugador se resetean a 0 en la nueva categoria.
              </p>
            </CardHeader>
            <CardContent>
              {categoryReviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay revisiones pendientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jugador</TableHead>
                      <TableHead>Modalidad</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead>Hacia</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Razon</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryReviews.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground">{r.player}</TableCell>
                        <TableCell className="text-muted-foreground">{r.modality}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.fromCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            r.type === "DESCENT" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          )}>{r.toCategory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px]",
                            r.type === "TOURNAMENT_WIN" && "bg-primary/10 text-primary",
                            r.type === "CONSECUTIVE_FINALS" && "bg-primary/10 text-primary",
                            r.type === "COMMITTEE_REVIEW" && "bg-chart-4/10 text-chart-4",
                            r.type === "DESCENT" && "bg-destructive/10 text-destructive",
                          )}>
                            {r.autoApproved ? "Auto" : "Manual"} - {r.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                          {r.reason || "Sin razón especificada"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="h-7 gap-1 bg-primary text-primary-foreground"
                              onClick={() => handleReviewCategory(r.id, "approve")}
                              disabled={reviewCategoryMutation.isPending}
                            >
                              <Check className="h-3 w-3" /> Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 gap-1"
                              onClick={() => handleReviewCategory(r.id, "reject")}
                              disabled={reviewCategoryMutation.isPending}
                            >
                              <X className="h-3 w-3" /> Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankingConfig">
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Rankings by category stats */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Rankings Activos por Categoria</CardTitle>
                <p className="text-xs text-muted-foreground">Cada categoria tiene ranking independiente</p>
              </CardHeader>
              <CardContent>
                {rankingStats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay estadísticas disponibles</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modalidad</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Jugadores</TableHead>
                        <TableHead className="text-right">Pts Promedio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingStats.map((s: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-foreground">{s.modality}</TableCell>
                          <TableCell><Badge variant="secondary">{s.category}</Badge></TableCell>
                          <TableCell className="text-center text-muted-foreground">{s.count}</TableCell>
                          <TableCell className="text-right font-display font-bold text-primary">
                            {Math.round(s.avgPoints).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Rules summary */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Reglas de Ascenso / Descenso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-card-foreground">Ascenso</h4>
                    <ul className="space-y-1.5">
                      {ascensionRules.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-muted-foreground">
                            <span className="font-medium text-card-foreground">{r.rule}</span> - {r.result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-card-foreground">Descenso</h4>
                    <ul className="space-y-1.5">
                      {descentRules.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                          <span className="text-muted-foreground">
                            <span className="font-medium text-card-foreground">{r.rule}</span> - {r.result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clubs">
          <div className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Solicitudes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingClubs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Canchas</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingClubs.map((club: any) => (
                        <TableRow key={club.id}>
                          <TableCell className="font-medium text-foreground">{club.name}</TableCell>
                          <TableCell className="text-muted-foreground">{club.city}</TableCell>
                          <TableCell className="text-muted-foreground">{club.courts}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{club.email}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(club.requestDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="h-7 gap-1 bg-primary text-primary-foreground"
                                onClick={() => handleApproveClub(club.id, "approve")}
                                disabled={approveClubMutation.isPending}
                              >
                                <Check className="h-3 w-3" /> Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 gap-1"
                                onClick={() => handleApproveClub(club.id, "reject")}
                                disabled={approveClubMutation.isPending}
                              >
                                <X className="h-3 w-3" /> Rechazar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

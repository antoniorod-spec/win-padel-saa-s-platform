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
import { adminStats, clubs, ascensionRules, descentRules, rankingsByCategory } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Clubes", icon: Building2, href: "/admin", badge: 3 },
  { label: "Jugadores", icon: Users, href: "/admin" },
  { label: "Torneos", icon: Trophy, href: "/admin" },
  { label: "Comite Categorias", icon: AlertTriangle, href: "/admin", badge: 5 },
  { label: "Ranking Config", icon: BarChart3, href: "/admin" },
  { label: "Reportes", icon: FileText, href: "/admin" },
  { label: "Noticias", icon: Newspaper, href: "/admin" },
  { label: "Configuracion", icon: Settings, href: "/admin" },
]

const pendingClubs = [
  { id: 1, name: "Padel Arena Cancun", city: "Cancun", courts: 6, requestDate: "10 Feb 2026", status: "pending" },
  { id: 2, name: "Pro Padel Tijuana", city: "Tijuana", courts: 4, requestDate: "11 Feb 2026", status: "pending" },
  { id: 3, name: "Padel Zone Leon", city: "Leon", courts: 8, requestDate: "12 Feb 2026", status: "pending" },
]

// Ascenso/descenso review: players flagged by the system
const categoryReviews = [
  { id: 1, player: "Ricardo Solis", modality: "Varonil", currentCat: "4ta", proposedCat: "3ra", reason: "Gano torneo Open SLP 2026", type: "ascenso" as const, auto: true },
  { id: 2, player: "Omar Fuentes", modality: "Varonil", currentCat: "4ta", proposedCat: "3ra", reason: "2 finales consecutivas (Copa Marietta + Loma Golf Masters)", type: "ascenso" as const, auto: true },
  { id: 3, player: "Hector Ibarra", modality: "Varonil", currentCat: "4ta", proposedCat: "3ra", reason: "Semifinales en 3 de ultimos 5 torneos", type: "revision" as const, auto: false },
  { id: 4, player: "Hugo Reyes", modality: "Varonil", currentCat: "4ta", proposedCat: "5ta", reason: "Eliminado en 1ra ronda en 5 torneos consecutivos - solicitud de descenso", type: "descenso" as const, auto: false },
  { id: 5, player: "Isabella Castro", modality: "Femenil", currentCat: "3ra", proposedCat: "2da", reason: "Gano torneo Loma Golf Masters Femenil", type: "ascenso" as const, auto: true },
]

// Ranking stats by category
const rankingCategoryStats = [
  { modality: "Varonil", cat: "4ta", count: 25, avgPoints: 1020 },
  { modality: "Varonil", cat: "3ra", count: 15, avgPoints: 1840 },
  { modality: "Femenil", cat: "3ra", count: 18, avgPoints: 1290 },
  { modality: "Mixto", cat: "C", count: 20, avgPoints: 920 },
]

export default function AdminDashboard() {
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
        <StatCard title="Total Clubes" value={adminStats.totalClubs} icon={Building2} trend="up" trendValue="12" />
        <StatCard title="Jugadores Activos" value={adminStats.activePlayers.toLocaleString()} icon={Users} trend="up" trendValue="342" />
        <StatCard title="Torneos en Curso" value={adminStats.activeTournaments} icon={Trophy} trend="up" trendValue="5" />
        <StatCard title="Ingresos Mensuales" value={adminStats.monthlyRevenue} icon={BarChart3} trend="up" trendValue="18%" />
      </div>

      {/* Tabs for management */}
      <Tabs defaultValue="categories" className="mt-6">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Comite Categorias
            <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-destructive/80 p-0 px-1.5 text-[10px] text-destructive-foreground">{categoryReviews.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rankingConfig" className="gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Ranking Config
          </TabsTrigger>
          <TabsTrigger value="clubs" className="gap-2">
            <Building2 className="h-3.5 w-3.5" />
            Clubes
            <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-primary p-0 px-1.5 text-[10px] text-primary-foreground">{pendingClubs.length}</Badge>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Propuesta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Razon</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryReviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">{r.player}</TableCell>
                      <TableCell className="text-muted-foreground">{r.modality}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.currentCat}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          r.type === "descenso" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}>{r.proposedCat}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px]",
                          r.type === "ascenso" && r.auto && "bg-primary/10 text-primary",
                          r.type === "ascenso" && !r.auto && "bg-chart-4/10 text-chart-4",
                          r.type === "revision" && "bg-chart-4/10 text-chart-4",
                          r.type === "descenso" && "bg-destructive/10 text-destructive",
                        )}>
                          {r.auto ? "Auto" : "Manual"} - {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-xs text-muted-foreground">{r.reason}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="h-7 gap-1 bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" /> Aprobar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1">
                            <X className="h-3 w-3" /> Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    {rankingCategoryStats.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-foreground">{s.modality}</TableCell>
                        <TableCell><Badge variant="secondary">{s.cat}</Badge></TableCell>
                        <TableCell className="text-center text-muted-foreground">{s.count}</TableCell>
                        <TableCell className="text-right font-display font-bold text-primary">{s.avgPoints.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                          <span className="text-muted-foreground"><span className="font-medium text-card-foreground">{r.rule}</span> - {r.result}</span>
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
                          <span className="text-muted-foreground"><span className="font-medium text-card-foreground">{r.rule}</span> - {r.result}</span>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Canchas</TableHead>
                      <TableHead>Fecha Solicitud</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingClubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium text-foreground">{club.name}</TableCell>
                        <TableCell className="text-muted-foreground">{club.city}</TableCell>
                        <TableCell className="text-muted-foreground">{club.courts}</TableCell>
                        <TableCell className="text-muted-foreground">{club.requestDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" className="h-7 gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                              <Check className="h-3 w-3" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-destructive hover:text-destructive">
                              <X className="h-3 w-3" /> Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Clubes Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Canchas</TableHead>
                      <TableHead>Jugadores</TableHead>
                      <TableHead>Torneos</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium text-foreground">{club.name}</TableCell>
                        <TableCell className="text-muted-foreground">{club.city}</TableCell>
                        <TableCell className="text-muted-foreground">{club.courts}</TableCell>
                        <TableCell className="text-muted-foreground">{club.players}</TableCell>
                        <TableCell className="text-muted-foreground">{club.tournaments}</TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary">{club.rating}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

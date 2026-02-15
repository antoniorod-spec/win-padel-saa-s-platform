"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  LayoutDashboard,
  Trophy,
  Users,
  CreditCard,
  Newspaper,
  BarChart3,
  Plus,
  Calendar,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react"
import { clubDashboardStats, upcomingTournaments } from "@/lib/mock-data"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/club" },
  { label: "Torneos", icon: Trophy, href: "/club" },
  { label: "Jugadores", icon: Users, href: "/club" },
  { label: "Pagos", icon: CreditCard, href: "/club", badge: 15 },
  { label: "Noticias", icon: Newspaper, href: "/club" },
  { label: "Estadisticas", icon: BarChart3, href: "/club" },
]

const clubTournaments = [
  { id: 1, name: "Open SLP 2026", status: "active", teams: 32, maxTeams: 64, date: "15-17 Mar 2026", format: "Eliminacion + Grupos" },
  { id: 2, name: "Liga Interna Primavera", status: "active", teams: 24, maxTeams: 24, date: "En curso", format: "Liga" },
  { id: 3, name: "Express Advantage Weekend", status: "upcoming", teams: 8, maxTeams: 16, date: "29 Mar 2026", format: "Express" },
]

const pendingPayments = [
  { id: 1, player: "Ricardo Solis / Jorge Vega", tournament: "Open SLP 2026", amount: "$800 MXN", status: "pending" },
  { id: 2, player: "Luis Paredes / Marco Diaz", tournament: "Open SLP 2026", amount: "$800 MXN", status: "pending" },
  { id: 3, player: "Ana Morales / Sofia Ruiz", tournament: "Open SLP 2026", amount: "$800 MXN", status: "confirmed" },
  { id: 4, player: "Pedro Castano / Raul Mendez", tournament: "Express Advantage Weekend", amount: "$400 MXN", status: "pending" },
]

const wizardSteps = ["Info Basica", "Categorias", "Formato", "Reglas", "Publicar"]

export default function ClubDashboard() {
  const [wizardStep, setWizardStep] = useState(0)
  const [showWizard, setShowWizard] = useState(false)

  return (
    <DashboardShell
      title="Advantage Padel"
      subtitle="Panel de gestion del club"
      navItems={navItems}
      activeItem="Dashboard"
      role="club"
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Torneos Activos" value={clubDashboardStats.activeTournaments} icon={Trophy} />
        <StatCard title="Jugadores" value={clubDashboardStats.totalPlayers} icon={Users} trend="up" trendValue="24" />
        <StatCard title="Pagos Pendientes" value={clubDashboardStats.pendingPayments} icon={CreditCard} />
        <StatCard title="Ingresos del Mes" value={clubDashboardStats.monthlyRevenue} icon={BarChart3} trend="up" trendValue="12%" />
      </div>

      {/* Quick action */}
      <div className="mt-6">
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Crear Nuevo Torneo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Crear Torneo - Paso {wizardStep + 1} de {wizardSteps.length}</DialogTitle>
            </DialogHeader>
            {/* Progress */}
            <div className="flex items-center gap-2">
              {wizardSteps.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= wizardStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i < wizardStep ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {wizardStep === 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Nombre del Torneo</Label>
                    <Input placeholder="Ej: Open CDMX 2026" className="bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Fecha Inicio</Label>
                      <Input type="date" className="bg-background" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Fecha Fin</Label>
                      <Input type="date" className="bg-background" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Precio Inscripcion</Label>
                    <Input placeholder="$800 MXN" className="bg-background" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Premio</Label>
                    <Input placeholder="$50,000 MXN" className="bg-background" />
                  </div>
                </div>
              )}
              {wizardStep === 1 && (
                <div className="flex flex-col gap-4">
                  <Label className="text-base font-semibold">Modalidades y Categorias</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Varonil", "Femenil", "Mixto"].map((mod) => (
                      <Card key={mod} className="cursor-pointer border-2 border-border/50 transition-colors hover:border-primary">
                        <CardContent className="p-4 text-center">
                          <p className="font-display font-bold text-card-foreground">{mod}</p>
                          <p className="text-xs text-muted-foreground">
                            {mod === "Mixto" ? "Cat. A, B, C, D" : "1ra a 6ta"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Categorias seleccionadas</Label>
                    <div className="flex flex-wrap gap-2">
                      {["1ra", "2da", "3ra", "4ta"].map((c) => (
                        <Badge key={c} className="bg-primary/10 text-primary">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="flex flex-col gap-4">
                  <Label className="text-base font-semibold">Formato del Torneo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Eliminacion Directa", desc: "Playoff desde octavos o dieciseisavos hasta la final" },
                      { name: "Round Robin + Eliminacion", desc: "Fase de grupos seguida de eliminacion directa" },
                      { name: "Liga", desc: "Todos contra todos, puntos por partido" },
                      { name: "Torneo Express", desc: "Un dia, eliminacion rapida" },
                    ].map((f) => (
                      <Card key={f.name} className="cursor-pointer border-2 border-border/50 transition-colors hover:border-primary">
                        <CardContent className="p-4">
                          <p className="font-display text-sm font-bold text-card-foreground">{f.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="flex flex-col gap-4">
                  <Label className="text-base font-semibold">Reglas del Torneo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Sets por partido</Label>
                      <Select>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Mejor de 2 sets</SelectItem>
                          <SelectItem value="3">Mejor de 3 sets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Games por set</Label>
                      <Select>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 games</SelectItem>
                          <SelectItem value="4">4 games (rapido)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Tie-break</Label>
                      <Select>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Si (7 puntos)</SelectItem>
                          <SelectItem value="super">Super tie-break (10 puntos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Golden Point</Label>
                      <Select>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Activado</SelectItem>
                          <SelectItem value="no">Desactivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 4 && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">Torneo Listo!</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Tu torneo sera publicado y los jugadores podran inscribirse inmediatamente.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" disabled={wizardStep === 0} onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}>
                Anterior
              </Button>
              {wizardStep < wizardSteps.length - 1 ? (
                <Button className="bg-primary text-primary-foreground" onClick={() => setWizardStep(wizardStep + 1)}>
                  Siguiente
                </Button>
              ) : (
                <Button className="bg-primary text-primary-foreground" onClick={() => setShowWizard(false)}>
                  Publicar Torneo
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tournaments" className="mt-6">
        <TabsList>
          <TabsTrigger value="tournaments" className="gap-2">
            <Trophy className="h-3.5 w-3.5" />
            Mis Torneos
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-3.5 w-3.5" />
            Pagos
            <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-primary p-0 px-1.5 text-[10px] text-primary-foreground">
              {pendingPayments.filter(p => p.status === "pending").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <div className="mt-4 space-y-3">
            {clubTournaments.map((t) => (
              <Card key={t.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-card-foreground">{t.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t.date}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.teams}/{t.maxTeams}</span>
                        <span>{t.format}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={t.status === "active" ? "bg-primary/10 text-primary" : "bg-chart-4/10 text-chart-4"}>
                      {t.status === "active" ? "Activo" : "Proximo"}
                    </Badge>
                    <Progress value={(t.teams / t.maxTeams) * 100} className="hidden w-20 sm:block" />
                    <Button size="sm" variant="ghost" className="text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="mt-4 border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pareja</TableHead>
                    <TableHead>Torneo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.player}</TableCell>
                      <TableCell className="text-muted-foreground">{p.tournament}</TableCell>
                      <TableCell className="font-semibold text-foreground">{p.amount}</TableCell>
                      <TableCell>
                        <Badge className={p.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-chart-4/10 text-chart-4"}>
                          <span className="flex items-center gap-1">
                            {p.status === "confirmed" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {p.status === "confirmed" ? "Confirmado" : "Pendiente"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "pending" && (
                          <Button size="sm" className="h-7 bg-primary text-primary-foreground">
                            Confirmar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { 
  useAdminStats, 
  usePendingClubs, 
  useCategoryReviews, 
  useRankingStats,
  useApproveClub, 
  useReviewCategoryChange,
  useSiteBannerSettings,
  useUpdateSiteBannerSettings,
} from "@/hooks/use-admin"
import { ASCENSION_RULES, DESCENT_RULES } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const t = useTranslations("AdminDashboard")
  const { toast } = useToast()
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const { data: clubsData } = usePendingClubs()
  const { data: categoryReviewsData } = useCategoryReviews("PENDING")
  const { data: rankingStatsData } = useRankingStats()
  const { data: siteBannerData } = useSiteBannerSettings()

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, href: "/admin" },
    { id: "clubs", label: t("nav.clubs"), icon: Building2, href: "/admin" },
    { id: "players", label: t("nav.players"), icon: Users, href: "/admin" },
    { id: "tournaments", label: t("nav.tournaments"), icon: Trophy, href: "/admin" },
    { id: "categoriesCommittee", label: t("nav.categoriesCommittee"), icon: AlertTriangle, href: "/admin" },
    { id: "rankingConfig", label: t("nav.rankingConfig"), icon: BarChart3, href: "/admin" },
    { id: "reports", label: t("nav.reports"), icon: FileText, href: "/admin" },
    { id: "news", label: t("nav.news"), icon: Newspaper, href: "/admin" },
    { id: "settings", label: t("nav.settings"), icon: Settings, href: "/admin" },
  ]
  
  const approveClubMutation = useApproveClub()
  const reviewCategoryMutation = useReviewCategoryChange()
  const updateSiteBannerMutation = useUpdateSiteBannerSettings()

  const stats = statsData?.data
  const pendingClubs = clubsData?.data || []
  const categoryReviews = categoryReviewsData?.data || []
  const rankingStats = rankingStatsData?.data || []
  const siteBanner = siteBannerData?.data
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerImageUrl, setBannerImageUrl] = useState("")
  const [bannerLinkUrl, setBannerLinkUrl] = useState("")
  const [bannerTitle, setBannerTitle] = useState("")
  const [clubsDirectoryMapEnabled, setClubsDirectoryMapEnabled] = useState(false)
  const [associations, setAssociations] = useState<Array<{ id: string; name: string; city: string }>>([])
  const [pendingResultSubmissions, setPendingResultSubmissions] = useState<Array<any>>([])
  const [selectedAssociationBySubmission, setSelectedAssociationBySubmission] = useState<Record<string, string>>({})
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null)

  useEffect(() => {
    if (!siteBanner) return
    setBannerEnabled(siteBanner.homeSponsorBannerEnabled)
    setBannerImageUrl(siteBanner.homeSponsorBannerImageUrl ?? "")
    setBannerLinkUrl(siteBanner.homeSponsorBannerLinkUrl ?? "")
    setBannerTitle(siteBanner.homeSponsorBannerTitle ?? "")
    setClubsDirectoryMapEnabled(Boolean(siteBanner.clubsDirectoryMapEnabled))
  }, [siteBanner])

  useEffect(() => {
    fetch("/api/associations")
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) setAssociations(payload.data)
      })
      .catch(() => {})
    fetch("/api/associations/results/pending")
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.data)) setPendingResultSubmissions(payload.data)
      })
      .catch(() => {})
  }, [])

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

  const handleSaveSiteBanner = async () => {
    try {
      await updateSiteBannerMutation.mutateAsync({
        homeSponsorBannerEnabled: bannerEnabled,
        homeSponsorBannerImageUrl: bannerImageUrl,
        homeSponsorBannerLinkUrl: bannerLinkUrl,
        homeSponsorBannerTitle: bannerTitle,
        clubsDirectoryMapEnabled,
      })
      toast({
        title: "Configuración guardada",
        description: "El banner público se actualizó correctamente",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración del banner",
        variant: "destructive",
      })
    }
  }

  const handleReviewResultSubmission = async (submissionId: string, action: "approve" | "reject") => {
    const associationId = selectedAssociationBySubmission[submissionId]
    if (!associationId) {
      toast({ title: "Selecciona asociación", description: "Debes elegir una asociación para validar.", variant: "destructive" })
      return
    }
    try {
      setReviewingSubmissionId(submissionId)
      const response = await fetch(`/api/associations/${associationId}/results/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo revisar")
      setPendingResultSubmissions((prev) => prev.filter((item) => item.id !== submissionId))
      toast({ title: "Revisión registrada", description: action === "approve" ? "Resultados aprobados." : "Resultados rechazados." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo revisar el envío.",
        variant: "destructive",
      })
    } finally {
      setReviewingSubmissionId(null)
    }
  }

  if (statsLoading) {
    return (
      <DashboardShell
        title={t("title")}
        subtitle={t("subtitle")}
        navItems={navItems}
        activeItemId="dashboard"
        role="admin"
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("loadingStats")}</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title={t("title")}
      subtitle={t("subtitle")}
      navItems={navItems}
      activeItemId="dashboard"
      role="admin"
    >
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title={t("cards.totalClubs")}
          value={stats?.totalClubs || 0} 
          icon={Building2} 
        />
        <StatCard 
          title={t("cards.activePlayers")}
          value={(stats?.activePlayers || 0).toLocaleString()} 
          icon={Users} 
        />
        <StatCard 
          title={t("cards.activeTournaments")}
          value={stats?.activeTournaments || 0} 
          icon={Trophy} 
        />
        <StatCard 
          title={t("cards.registrations")}
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
          <TabsTrigger value="siteConfig" className="gap-2">
            <Settings className="h-3.5 w-3.5" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="resultValidation" className="gap-2">
            <Check className="h-3.5 w-3.5" />
            Validación Resultados
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
                      {ASCENSION_RULES.map((r, i) => (
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
                      {DESCENT_RULES.map((r, i) => (
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

        <TabsContent value="siteConfig">
          <Card className="mt-4 border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Banner de patrocinio en home</CardTitle>
              <p className="text-xs text-muted-foreground">
                Solo se mostrará al público cuando esté activado y tenga imagen.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">Mostrar banner en home</p>
                  <p className="text-xs text-muted-foreground">Controlado por superadmin</p>
                </div>
                <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
              </div>

              <div className="space-y-2">
                <Label>URL de imagen del banner</Label>
                <Input
                  placeholder="https://.../banner.jpg"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  placeholder="Patrocinador oficial"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>URL de destino (opcional)</Label>
                <Input
                  placeholder="https://sitio-del-patrocinador.com"
                  value={bannerLinkUrl}
                  onChange={(e) => setBannerLinkUrl(e.target.value)}
                />
              </div>

              <div className="mt-6 rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Directorio de clubes: habilitar mapa</p>
                    <p className="text-xs text-muted-foreground">
                      Útil para desactivar mientras Google Maps no tenga facturación habilitada.
                    </p>
                  </div>
                  <Switch checked={clubsDirectoryMapEnabled} onCheckedChange={setClubsDirectoryMapEnabled} />
                </div>
              </div>

              <Button
                onClick={handleSaveSiteBanner}
                disabled={updateSiteBannerMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                {updateSiteBannerMutation.isPending ? "Guardando..." : "Guardar configuración"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultValidation">
          <Card className="mt-4 border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Pendientes de validación de resultados</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingResultSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay envíos pendientes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Torneo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Filas</TableHead>
                      <TableHead>Asociación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingResultSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.tournament?.name}</TableCell>
                        <TableCell>{submission.submissionType}</TableCell>
                        <TableCell>{submission.rows?.length ?? 0}</TableCell>
                        <TableCell>
                          <Select
                            value={selectedAssociationBySubmission[submission.id] || ""}
                            onValueChange={(value) => setSelectedAssociationBySubmission((prev) => ({ ...prev, [submission.id]: value }))}
                          >
                            <SelectTrigger className="w-[240px]">
                              <SelectValue placeholder="Selecciona asociación" />
                            </SelectTrigger>
                            <SelectContent>
                              {associations.map((association) => (
                                <SelectItem key={association.id} value={association.id}>
                                  {association.name} ({association.city})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReviewResultSubmission(submission.id, "approve")}
                              disabled={reviewingSubmissionId === submission.id}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewResultSubmission(submission.id, "reject")}
                              disabled={reviewingSubmissionId === submission.id}
                            >
                              Rechazar
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
      </Tabs>
    </DashboardShell>
  )
}

"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import {
  DaySchedule,
  defaultWeeklySchedule,
  WeeklyScheduleEditor,
} from "@/components/club/weekly-schedule-editor"
import { ImageUploadField } from "@/components/club/image-upload-field"
import { OnboardingSectionCard } from "@/components/onboarding/onboarding-section-card"
import { cn } from "@/lib/utils"
import { buildCityKey, buildStateKey } from "@/lib/location/keys"
import {
  LayoutDashboard,
  Trophy,
  Users,
  Newspaper,
  BarChart3,
  Plus,
  Check,
  CreditCard,
  Building2,
  Car,
  Lock,
  ShowerHead,
  Utensils,
  Store,
  Lightbulb,
  Snowflake,
} from "lucide-react"
import {
  useTournaments,
  useDeleteTournament,
  useTransitionTournamentStatus,
  useImportTournamentResultsFile,
  useSubmitTournamentResultsManual,
  useTournamentResultSubmissions,
  useTournamentCourts,
  useCreateTournamentCourt,
  useDeleteTournamentCourt,
  useSetTournamentCourtAvailability,
  useGenerateTournamentSlots,
  useGenerateModalityGroups,
  useGenerateTournamentSchedule,
  useGenerateMirrorBracket,
  useTournament,
} from "@/hooks/use-tournaments"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const sectionIds = ["dashboard", "torneos", "jugadores", "pagos", "noticias", "estadisticas", "perfil"] as const
type SectionId = (typeof sectionIds)[number]

const surfaceOptions = ["Cesped Sintetico", "Mondo", "Cemento", "Mixta"]
const resultStageOptions = ["CHAMPION", "RUNNER_UP", "SEMIFINAL", "QUARTERFINAL", "ROUND_OF_16", "ROUND_OF_32", "GROUP_STAGE"] as const

function ClubDashboardContent() {
  const t = useTranslations("ClubDashboard")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const section = (searchParams.get("section") || "dashboard").toLowerCase() as SectionId
  const activeItemId: SectionId = sectionIds.includes(section) ? section : "dashboard"
  const activeItemLabel = t(`nav.${activeItemId}`)

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, href: "/club?section=dashboard" },
    { id: "torneos", label: t("nav.torneos"), icon: Trophy, href: "/club?section=torneos" },
    { id: "jugadores", label: t("nav.jugadores"), icon: Users, href: "/club?section=jugadores" },
    { id: "pagos", label: t("nav.pagos"), icon: CreditCard, href: "/club?section=pagos", badge: 15 },
    { id: "noticias", label: t("nav.noticias"), icon: Newspaper, href: "/club?section=noticias" },
    { id: "estadisticas", label: t("nav.estadisticas"), icon: BarChart3, href: "/club?section=estadisticas" },
    { id: "perfil", label: t("nav.perfil"), icon: Building2, href: "/club?section=perfil" },
  ]

  // Club profile form
  const [clubId, setClubId] = useState("")
  const [clubName, setClubName] = useState("")
  const [clubDescription, setClubDescription] = useState("")
  const [legalName, setLegalName] = useState("")
  const [clubRfc, setClubRfc] = useState("")
  const [clubPhone, setClubPhone] = useState("")
  const [clubEmail, setClubEmail] = useState("")
  const [clubWebsite, setClubWebsite] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPosition, setContactPosition] = useState("")
  const [country, setCountry] = useState("MX")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [selectedStateKey, setSelectedStateKey] = useState("")
  const [selectedCityKey, setSelectedCityKey] = useState("")
  const [locationStates, setLocationStates] = useState<string[]>([])
  const [locationCitiesByState, setLocationCitiesByState] = useState<Record<string, string[]>>({})
  const [locationStateLabels, setLocationStateLabels] = useState<Record<string, string>>({})
  const [locationCityLabels, setLocationCityLabels] = useState<Record<string, string>>({})
  const [address, setAddress] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)
  const [indoorCourts, setIndoorCourts] = useState("0")
  const [outdoorCourts, setOutdoorCourts] = useState("0")
  const [courtSurfaces, setCourtSurfaces] = useState<string[]>([])
  const [hasParking, setHasParking] = useState(false)
  const [hasLockers, setHasLockers] = useState(false)
  const [hasShowers, setHasShowers] = useState(false)
  const [hasCafeteria, setHasCafeteria] = useState(false)
  const [hasProShop, setHasProShop] = useState(false)
  const [hasLighting, setHasLighting] = useState(false)
  const [hasAirConditioning, setHasAirConditioning] = useState(false)
  const [operatingHours, setOperatingHours] = useState("")
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(defaultWeeklySchedule())
  const [priceRange, setPriceRange] = useState("")
  const [acceptsOnlineBooking, setAcceptsOnlineBooking] = useState(false)
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [youtube, setYoutube] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [x, setX] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [clubLogoUrls, setClubLogoUrls] = useState<string[]>([])
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  const [servicesText, setServicesText] = useState("")

  // Club news section
  const [newsItems, setNewsItems] = useState<Array<{
    id: string
    title: string
    content: string
    coverImageUrl?: string | null
    published: boolean
    publishedAt?: string | null
  }>>([])
  const [newsTitle, setNewsTitle] = useState("")
  const [newsContent, setNewsContent] = useState("")
  const [newsCover, setNewsCover] = useState("")
  const [newsPublished, setNewsPublished] = useState(false)
  const [savingNews, setSavingNews] = useState(false)
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSavedAt, setProfileSavedAt] = useState("Sin cambios recientes")
  const [resultTournamentId, setResultTournamentId] = useState("")
  const [resultModality, setResultModality] = useState<"VARONIL" | "FEMENIL" | "MIXTO">("VARONIL")
  const [resultCategory, setResultCategory] = useState("4ta")
  const [resultStage, setResultStage] = useState<typeof resultStageOptions[number]>("CHAMPION")
  const [resultP1Name, setResultP1Name] = useState("")
  const [resultP2Name, setResultP2Name] = useState("")
  const [resultsFile, setResultsFile] = useState<File | null>(null)

  const { data: tournamentsData } = useTournaments({ pageSize: 20, mine: true })
  const deleteTournament = useDeleteTournament()
  const transitionTournamentStatus = useTransitionTournamentStatus()
  const submitManualResults = useSubmitTournamentResultsManual()
  const importResultsFile = useImportTournamentResultsFile()
  const { data: resultSubmissionsData } = useTournamentResultSubmissions(resultTournamentId || undefined)

  useEffect(() => {
    let active = true
    fetch("/api/auth/profile-status")
      .then((r) => r.json())
      .then((payload) => {
        if (!active || !payload?.success) return
        if (!payload.data.isClubProfileComplete) {
          router.push("/onboarding/club")
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [router])

  useEffect(() => {
    let active = true
    fetch("/api/clubs/me")
      .then((r) => r.json())
      .then((payload) => {
        if (!active || !payload?.success) return
        const c = payload.data
        setClubId(c.id)
        setClubName(c.name || "")
        setClubDescription(c.description || "")
        setLegalName(c.legalName || "")
        setClubRfc(c.rfc || "")
        setClubPhone(c.phone || "")
        setClubEmail(c.email || "")
        setClubWebsite(c.website || "")
        setContactName(c.contactName || "")
        setContactPhone(c.contactPhone || "")
        setContactEmail(c.contactEmail || "")
        setContactPosition(c.contactPosition || "")
        setCountry(c.country || "MX")
        setState(c.state || "")
        setCity(c.city || "")
        setSelectedStateKey(c.state ? buildStateKey(c.country || "MX", c.state) : "")
        setSelectedCityKey(c.state && c.city ? buildCityKey(c.country || "MX", c.state, c.city) : "")
        setAddress(c.address || "")
        setPostalCode(c.postalCode || "")
        setNeighborhood(c.neighborhood || "")
        setLatitude(typeof c.latitude === "number" ? c.latitude : undefined)
        setLongitude(typeof c.longitude === "number" ? c.longitude : undefined)
        setIndoorCourts(String(c.indoorCourts ?? 0))
        setOutdoorCourts(String(c.outdoorCourts ?? 0))
        setCourtSurfaces(
          Array.isArray(c.courtSurfaces) && c.courtSurfaces.length > 0
            ? c.courtSurfaces
            : c.courtSurface
              ? [c.courtSurface]
              : []
        )
        setHasParking(Boolean(c.hasParking))
        setHasLockers(Boolean(c.hasLockers))
        setHasShowers(Boolean(c.hasShowers))
        setHasCafeteria(Boolean(c.hasCafeteria))
        setHasProShop(Boolean(c.hasProShop))
        setHasLighting(Boolean(c.hasLighting))
        setHasAirConditioning(Boolean(c.hasAirConditioning))
        setOperatingHours(c.operatingHours || "")
        setWeeklySchedule(
          Array.isArray(c.weeklySchedule) && c.weeklySchedule.length === 7
            ? c.weeklySchedule
            : defaultWeeklySchedule()
        )
        setPriceRange(c.priceRange || "")
        setAcceptsOnlineBooking(Boolean(c.acceptsOnlineBooking))
        setFacebook(c.facebook || "")
        setInstagram(c.instagram || "")
        setTiktok(c.tiktok || "")
        setYoutube(c.youtube || "")
        setLinkedin(c.linkedin || "")
        setX(c.x || "")
        setWhatsapp(c.whatsapp || "")
        setClubLogoUrls(c.logoUrl ? [c.logoUrl] : [])
        setGalleryUrls(Array.isArray(c.photos) ? c.photos : [])
        setServicesText(Array.isArray(c.services) ? c.services.join(", ") : "")
        setNewsItems(Array.isArray(c.news) ? c.news : [])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch(`/api/location/catalog?country=${encodeURIComponent(country || "MX")}`)
      .then((r) => r.json())
      .then((payload) => {
        if (!active || !payload?.success) return
        setLocationStates(Array.isArray(payload.data?.states) ? payload.data.states : [])
        setLocationCitiesByState(payload.data?.citiesByState ?? {})
        setLocationStateLabels(payload.data?.stateLabels ?? {})
        setLocationCityLabels(payload.data?.cityLabels ?? {})
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [country])

  const tournaments = tournamentsData?.data?.items ?? []
  const myStats = useMemo(() => {
    const active = tournaments.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS").length
    const teams = tournaments.reduce((sum: number, t: any) => sum + (t.registeredTeams || 0), 0)
    return { active, total: tournaments.length, teams }
  }, [tournaments])

  async function saveProfile() {
    if (!clubId) return
    setSavingProfile(true)
    try {
      const response = await fetch("/api/clubs/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
          description: clubDescription || undefined,
          legalName: legalName || undefined,
          rfc: clubRfc || undefined,
          phone: clubPhone,
          email: clubEmail || undefined,
          website: clubWebsite || undefined,
          contactName,
          contactPhone,
          contactEmail: contactEmail || undefined,
          contactPosition: contactPosition || undefined,
          country,
          state,
          city,
          address,
          postalCode: postalCode || undefined,
          neighborhood: neighborhood || undefined,
          latitude,
          longitude,
          indoorCourts: Number(indoorCourts || 0),
          outdoorCourts: Number(outdoorCourts || 0),
          courtSurface: courtSurfaces[0] || undefined,
          courtSurfaces,
          hasParking,
          hasLockers,
          hasShowers,
          hasCafeteria,
          hasProShop,
          hasLighting,
          hasAirConditioning,
          operatingHours: operatingHours || undefined,
          weeklySchedule,
          priceRange: priceRange || undefined,
          acceptsOnlineBooking,
          services: servicesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          photos: galleryUrls,
          logoUrl: clubLogoUrls[0] || undefined,
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          tiktok: tiktok || undefined,
          youtube: youtube || undefined,
          linkedin: linkedin || undefined,
          x: x || undefined,
          whatsapp: whatsapp || undefined,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar")
      setProfileSavedAt(`Ultimo guardado: ${new Date().toLocaleTimeString()}`)
      toast({ title: "Perfil actualizado", description: "Los datos del club se guardaron correctamente." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el perfil.",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  function resetNewsForm() {
    setNewsTitle("")
    setNewsContent("")
    setNewsCover("")
    setNewsPublished(false)
    setEditingNewsId(null)
  }

  async function saveNews() {
    setSavingNews(true)
    try {
      const endpoint = editingNewsId ? `/api/clubs/me/news/${editingNewsId}` : "/api/clubs/me/news"
      const method = editingNewsId ? "PUT" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent,
          coverImageUrl: newsCover || undefined,
          published: newsPublished,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar novedad")

      const latest = await fetch("/api/clubs/me").then((r) => r.json())
      if (latest?.success && Array.isArray(latest.data?.news)) {
        setNewsItems(latest.data.news)
      }
      resetNewsForm()
      toast({ title: "Novedad guardada", description: "La novedad se actualizo correctamente." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la novedad.",
        variant: "destructive",
      })
    } finally {
      setSavingNews(false)
    }
  }

  async function removeNews(id: string) {
    try {
      const response = await fetch(`/api/clubs/me/news/${id}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar")
      setNewsItems((prev) => prev.filter((n) => n.id !== id))
      toast({ title: "Novedad eliminada", description: "Se elimino la novedad del club." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la novedad.",
        variant: "destructive",
      })
    }
  }

  function startEditNews(item: {
    id: string
    title: string
    content: string
    coverImageUrl?: string | null
    published: boolean
  }) {
    setEditingNewsId(item.id)
    setNewsTitle(item.title)
    setNewsContent(item.content)
    setNewsCover(item.coverImageUrl || "")
    setNewsPublished(item.published)
  }

  async function submitManualResult() {
    if (!resultTournamentId || !resultP1Name || !resultP2Name) return
    try {
      await submitManualResults.mutateAsync({
        tournamentId: resultTournamentId,
        rows: [{
          modality: resultModality,
          category: resultCategory,
          finalStage: resultStage,
          importedPlayer1Name: resultP1Name,
          importedPlayer2Name: resultP2Name,
        }],
      })
      setResultP1Name("")
      setResultP2Name("")
      toast({ title: "Resultados enviados", description: "Quedaron en revisión de asociación." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron enviar resultados.",
        variant: "destructive",
      })
    }
  }

  async function submitResultsExcel() {
    if (!resultTournamentId || !resultsFile) return
    try {
      const response = await importResultsFile.mutateAsync({
        tournamentId: resultTournamentId,
        file: resultsFile,
      })
      if (!response?.success) {
        throw new Error(response?.error || "No se pudo importar")
      }
      setResultsFile(null)
      toast({ title: "Excel importado", description: "Resultados enviados a revisión." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo importar el archivo.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardShell
      title={session?.user?.name || "Panel de Club"}
      subtitle={t("subtitle")}
      navItems={navItems}
      activeItemId={activeItemId}
      role="club"
    >
      {(section === "dashboard" || section === "torneos") && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Torneos activos</p><p className="text-2xl font-bold">{myStats.active}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Torneos totales</p><p className="text-2xl font-bold">{myStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Parejas registradas</p><p className="text-2xl font-bold">{myStats.teams}</p></CardContent></Card>
          </div>

          <div className="mt-6">
            <Button
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <Link href="/club/torneos/nuevo">
                <Plus className="h-4 w-4" />
                Crear Nuevo Torneo
              </Link>
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {tournaments.map((t: any) => (
              <Card key={t.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{t.category}</Badge>
                    <Badge variant="outline">{t.format}</Badge>
                    <Badge variant="outline">{t.status}</Badge>
                  </div>
                  <p>{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</p>
                  <p>Parejas: {t.registeredTeams}/{t.maxTeams}</p>
                  <Progress value={(t.registeredTeams / t.maxTeams) * 100} />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" className="gap-2" asChild>
                      <Link href={{ pathname: "/club/torneos/[id]/editar", params: { id: String(t.id) } }}>
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        router.push({ pathname: "/club/torneos/[id]/automatizacion", params: { id: String(t.id) } } as any)
                      }}
                    >
                      <Trophy className="h-4 w-4" />
                      Automatizacion
                    </Button>

                    {t.status !== "DRAFT" && t.status !== "CANCELLED" && t.status !== "COMPLETED" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="gap-2" disabled={transitionTournamentStatus.isPending}>
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Seguro que quieres cancelar este torneo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta accion cambia el estado a CANCELLED. No elimina el registro del torneo (queda como historico).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  const res: any = await transitionTournamentStatus.mutateAsync({ tournamentId: String(t.id), status: "CANCELLED" })
                                  if (!res?.success) throw new Error(res?.error || "No se pudo cancelar")
                                  toast({ title: "Torneo cancelado" })
                                } catch (err) {
                                  toast({
                                    title: "Error",
                                    description: err instanceof Error ? err.message : "No se pudo cancelar",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              Si, cancelar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}

                    {Number(t.registeredTeams || 0) === 0 &&
                    (t.status === "DRAFT" || t.status === "OPEN" || t.status === "CLOSED" || t.status === "GENERATED") ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="gap-2" disabled={deleteTournament.isPending}>
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Seguro que quieres eliminarlo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto eliminara el torneo y toda su configuracion. Si solo quieres bajarlo sin borrarlo, puedes usar la opcion de cancelar.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-muted text-foreground hover:bg-muted/80"
                              onClick={async () => {
                                try {
                                  const res: any = await transitionTournamentStatus.mutateAsync({ tournamentId: String(t.id), status: "CANCELLED" })
                                  if (!res?.success) throw new Error(res?.error || "No se pudo cancelar")
                                  toast({ title: "Torneo cancelado" })
                                } catch (err) {
                                  toast({
                                    title: "Error",
                                    description: err instanceof Error ? err.message : "No se pudo cancelar",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              Cancelar torneo
                            </AlertDialogAction>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  const res: any = await deleteTournament.mutateAsync(String(t.id))
                                  if (!res?.success) throw new Error(res?.error || "No se pudo eliminar")
                                  toast({ title: "Torneo eliminado" })
                                } catch (err) {
                                  toast({
                                    title: "Error",
                                    description: err instanceof Error ? err.message : "No se pudo eliminar",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {section === "perfil" && (
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Perfil del club</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <OnboardingSectionCard
                  title="Información general"
                  description="Datos principales que verán jugadores y asociaciones."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2"><Label>Nombre del club</Label><Input value={clubName} onChange={(e) => setClubName(e.target.value)} /></div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Descripcion corta</Label>
                      <Textarea
                        value={clubDescription}
                        onChange={(e) => setClubDescription(e.target.value)}
                        placeholder="Describe en pocas lineas el club, su propuesta y ambiente."
                      />
                    </div>
                    <div className="space-y-2"><Label>Razon social</Label><Input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>RFC</Label><Input value={clubRfc} onChange={(e) => setClubRfc(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Telefono del club</Label><Input value={clubPhone} onChange={(e) => setClubPhone(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email del club</Label><Input value={clubEmail} onChange={(e) => setClubEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Sitio web</Label><Input value={clubWebsite} onChange={(e) => setClubWebsite(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Contacto responsable</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Telefono contacto</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Email contacto</Label><Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Puesto contacto</Label><Input value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} /></div>
                  </div>
                </OnboardingSectionCard>

                <OnboardingSectionCard
                  title="Ubicación"
                  description="Asegura una dirección precisa para búsqueda y mapas."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pais</Label>
                      <Select value={country} onValueChange={(value) => {
                        setCountry(value)
                        setSelectedStateKey("")
                        setSelectedCityKey("")
                        setState("")
                        setCity("")
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="ES">Espana</SelectItem>
                          <SelectItem value="AR">Argentina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado/Provincia</Label>
                      <Select
                        value={selectedStateKey || "all"}
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSelectedStateKey("")
                            setSelectedCityKey("")
                            setState("")
                            setCity("")
                            return
                          }
                          setSelectedStateKey(value)
                          setSelectedCityKey("")
                          setState(locationStateLabels[value] ?? "")
                          setCity("")
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Selecciona</SelectItem>
                          {locationStates.map((key) => (
                            <SelectItem key={key} value={key}>
                              {locationStateLabels[key] ?? key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Select
                        value={selectedCityKey || "all"}
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSelectedCityKey("")
                            setCity("")
                            return
                          }
                          setSelectedCityKey(value)
                          setCity(locationCityLabels[value] ?? city)
                        }}
                        disabled={!selectedStateKey}
                      >
                        <SelectTrigger><SelectValue placeholder={selectedStateKey ? "Selecciona" : "Selecciona estado primero"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Selecciona</SelectItem>
                          {(locationCitiesByState[selectedStateKey] ?? []).map((key) => (
                            <SelectItem key={key} value={key}>
                              {locationCityLabels[key] ?? key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Codigo postal</Label><Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Colonia</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        label="Direccion"
                        value={address}
                        onChange={setAddress}
                        onCoordinatesChange={(lat, lng) => {
                          setLatitude(lat)
                          setLongitude(lng)
                        }}
                        placeholder="Busca por negocio o direccion"
                      />
                    </div>
                  </div>
                </OnboardingSectionCard>

                <OnboardingSectionCard
                  title="Instalaciones"
                  description="Gestiona canchas, superficies y horarios."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Canchas interiores</Label><Input type="number" value={indoorCourts} onChange={(e) => setIndoorCourts(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Canchas exteriores</Label><Input type="number" value={outdoorCourts} onChange={(e) => setOutdoorCourts(e.target.value)} /></div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm md:col-span-2">
                      Total de canchas: <span className="font-semibold text-primary">{(parseInt(indoorCourts || "0", 10) || 0) + (parseInt(outdoorCourts || "0", 10) || 0)}</span>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Superficies</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        {surfaceOptions.map((surface) => {
                          const selected = courtSurfaces.includes(surface)
                          return (
                            <button
                              key={surface}
                              type="button"
                              onClick={() =>
                                setCourtSurfaces((prev) =>
                                  selected ? prev.filter((item) => item !== surface) : [...prev, surface]
                                )
                              }
                              className={cn(
                                "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 bg-background text-foreground hover:border-primary/40"
                              )}
                            >
                              {surface}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Horario base (legacy)</Label>
                      <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} />
                    </div>
                    <div className="space-y-2"><Label>Rango de precio</Label><Input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} /></div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Horario semanal por dia</Label>
                      <WeeklyScheduleEditor value={weeklySchedule} onChange={setWeeklySchedule} />
                    </div>
                  </div>
                </OnboardingSectionCard>

                <OnboardingSectionCard
                  title="Servicios y visibilidad"
                  description="Destaca comodidades y canales para atraer jugadores."
                >
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Estacionamiento", icon: Car, active: hasParking, setter: setHasParking },
                        { label: "Vestidores", icon: Lock, active: hasLockers, setter: setHasLockers },
                        { label: "Regaderas", icon: ShowerHead, active: hasShowers, setter: setHasShowers },
                        { label: "Cafeteria", icon: Utensils, active: hasCafeteria, setter: setHasCafeteria },
                        { label: "Pro shop", icon: Store, active: hasProShop, setter: setHasProShop },
                        { label: "Iluminacion", icon: Lightbulb, active: hasLighting, setter: setHasLighting },
                        { label: "Aire acondicionado", icon: Snowflake, active: hasAirConditioning, setter: setHasAirConditioning },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => item.setter(!item.active)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                              item.active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 bg-background text-foreground hover:border-primary/40"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        )
                      })}
                      <label className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-3 text-sm">
                        <Checkbox checked={acceptsOnlineBooking} onCheckedChange={(v) => setAcceptsOnlineBooking(Boolean(v))} />
                        Reserva online
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Facebook</Label><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} /></div>
                      <div className="space-y-2"><Label>Instagram</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
                      <div className="space-y-2"><Label>TikTok</Label><Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
                      <div className="space-y-2"><Label>YouTube</Label><Input value={youtube} onChange={(e) => setYoutube(e.target.value)} /></div>
                      <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
                      <div className="space-y-2"><Label>X</Label><Input value={x} onChange={(e) => setX(e.target.value)} /></div>
                      <div className="space-y-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Servicios (separados por coma)</Label><Textarea value={servicesText} onChange={(e) => setServicesText(e.target.value)} /></div>
                    </div>
                  </div>
                </OnboardingSectionCard>

                <OnboardingSectionCard
                  title="Identidad visual"
                  description="Sube y actualiza logo y galería pública."
                >
                  <div className="space-y-4">
                    <ImageUploadField
                      label="Logo del club"
                      endpoint="/api/uploads/club/logo"
                      value={clubLogoUrls}
                      onChange={setClubLogoUrls}
                    />
                    <ImageUploadField
                      label="Galeria del club"
                      endpoint="/api/uploads/club/gallery"
                      multiple
                      value={galleryUrls}
                      onChange={setGalleryUrls}
                    />
                  </div>
                </OnboardingSectionCard>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Estado del perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Completa y actualiza los bloques para mejorar visibilidad del club y conversión de reservas.</p>
                <p>{profileSavedAt}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={saveProfile} disabled={savingProfile} className="w-full bg-primary text-primary-foreground">
                  {savingProfile ? "Guardando..." : "Guardar perfil"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {section === "noticias" && (
        <Card className="border-border/50">
          <CardHeader><CardTitle>Novedades del Club</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="space-y-2"><Label>Titulo</Label><Input value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Contenido</Label><Textarea value={newsContent} onChange={(e) => setNewsContent(e.target.value)} /></div>
              <div className="space-y-2"><Label>Imagen portada URL</Label><Input value={newsCover} onChange={(e) => setNewsCover(e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={newsPublished} onCheckedChange={(v) => setNewsPublished(Boolean(v))} /> Publicar ahora</label>
              <div className="flex gap-2">
                <Button onClick={saveNews} disabled={savingNews}>{savingNews ? "Guardando..." : editingNewsId ? "Actualizar" : "Crear novedad"}</Button>
                {editingNewsId ? <Button variant="outline" onClick={resetNewsForm}>Cancelar</Button> : null}
              </div>
            </div>
            <div className="space-y-2">
              {newsItems.map((n) => (
                <div key={n.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.published ? "Publicada" : "Borrador"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditNews(n)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeNews(n.id)}>Eliminar</Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{n.content}</p>
                </div>
              ))}
              {newsItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay novedades todavia.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {section === "estadisticas" && (
        <Card className="border-border/50">
          <CardHeader><CardTitle>Resultados para Ranking Nacional</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Torneo</Label>
                <Select value={resultTournamentId} onValueChange={setResultTournamentId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona torneo" /></SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modalidad</Label>
                <Select value={resultModality} onValueChange={(v: "VARONIL" | "FEMENIL" | "MIXTO") => setResultModality(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VARONIL">VARONIL</SelectItem>
                    <SelectItem value="FEMENIL">FEMENIL</SelectItem>
                    <SelectItem value="MIXTO">MIXTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={resultCategory} onChange={(e) => setResultCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={resultStage} onValueChange={(v: typeof resultStageOptions[number]) => setResultStage(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {resultStageOptions.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jugador 1</Label>
                <Input value={resultP1Name} onChange={(e) => setResultP1Name(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-2">
                <Label>Jugador 2</Label>
                <Input value={resultP2Name} onChange={(e) => setResultP2Name(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="md:col-span-2">
                <Button onClick={submitManualResult} disabled={submitManualResults.isPending}>Enviar resultado manual</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <p className="text-sm font-medium">Importar resultados por Excel</p>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setResultsFile(e.target.files?.[0] ?? null)} />
              <Button variant="outline" onClick={submitResultsExcel} disabled={!resultsFile || importResultsFile.isPending}>
                Importar Excel
              </Button>
              <p className="text-xs text-muted-foreground">
                Columnas recomendadas: modalidad, categoria, etapa, player1_name, player2_name
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Envios recientes</p>
              {(resultSubmissionsData?.data ?? []).map((submission: any) => (
                <div key={submission.id} className="rounded border border-border/50 p-3 text-sm">
                  <p className="font-medium">{submission.submissionType} - {submission.status}</p>
                  <p className="text-xs text-muted-foreground">Filas: {submission.rows?.length ?? 0}</p>
                  {submission.validationNotes ? <p className="text-xs text-muted-foreground">{submission.validationNotes}</p> : null}
                </div>
              ))}
              {(resultSubmissionsData?.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin envios para este torneo.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {["jugadores", "pagos"].includes(section) && (
        <Card className="border-border/50">
          <CardHeader><CardTitle>{activeItemLabel}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta sección ya responde desde el sidebar y queda lista para conectar tus flujos reales.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  )
}

export default function ClubDashboard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando panel de club...</div>}>
      <ClubDashboardContent />
    </Suspense>
  )
}

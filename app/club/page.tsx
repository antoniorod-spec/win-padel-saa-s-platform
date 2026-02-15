"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { LayoutDashboard, Trophy, Users, Newspaper, BarChart3, Plus, Check, CreditCard, Building2 } from "lucide-react"
import {
  useCreateTournament,
  useTournaments,
  useImportTournamentResultsFile,
  useSubmitTournamentResultsManual,
  useTournamentResultSubmissions,
} from "@/hooks/use-tournaments"
import { useToast } from "@/hooks/use-toast"

const sectionToLabel: Record<string, string> = {
  dashboard: "Dashboard",
  torneos: "Torneos",
  jugadores: "Jugadores",
  pagos: "Pagos",
  noticias: "Noticias",
  estadisticas: "Estadisticas",
  perfil: "Perfil Club",
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/club?section=dashboard" },
  { label: "Torneos", icon: Trophy, href: "/club?section=torneos" },
  { label: "Jugadores", icon: Users, href: "/club?section=jugadores" },
  { label: "Pagos", icon: CreditCard, href: "/club?section=pagos", badge: 15 },
  { label: "Noticias", icon: Newspaper, href: "/club?section=noticias" },
  { label: "Estadisticas", icon: BarChart3, href: "/club?section=estadisticas" },
  { label: "Perfil Club", icon: Building2, href: "/club?section=perfil" },
]

const wizardSteps = ["Info Basica", "Categorias", "Formato", "Reglas", "Publicar"]
const surfaceOptions = ["Cesped Sintetico", "Mondo", "Cemento", "Mixta"]
const resultStageOptions = ["CHAMPION", "RUNNER_UP", "SEMIFINAL", "QUARTERFINAL", "ROUND_OF_16", "ROUND_OF_32", "GROUP_STAGE"] as const

function ClubDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const section = (searchParams.get("section") || "dashboard").toLowerCase()
  const activeItem = sectionToLabel[section] || "Dashboard"

  const [wizardStep, setWizardStep] = useState(0)
  const [showWizard, setShowWizard] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [venue, setVenue] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [category, setCategory] = useState<"A" | "B" | "C">("C")
  const [format, setFormat] = useState<"ELIMINATION" | "ROUND_ROBIN" | "LEAGUE" | "EXPRESS">("ROUND_ROBIN")
  const [tournamentType, setTournamentType] = useState<"FULL" | "BASIC">("FULL")
  const [registrationDeadline, setRegistrationDeadline] = useState("")
  const [externalRegistrationType, setExternalRegistrationType] = useState<"URL" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "OTHER">("URL")
  const [externalRegistrationLink, setExternalRegistrationLink] = useState("")
  const [posterUrl, setPosterUrl] = useState("")
  const [price, setPrice] = useState("0")
  const [prize, setPrize] = useState("")
  const [sponsorName, setSponsorName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState("")
  const [rules, setRules] = useState({
    setsPerMatch: 3,
    gamesPerSet: 6,
    tieBreak: "yes",
    goldenPoint: false,
  })
  const [selectedModalities, setSelectedModalities] = useState<Array<{ modality: "VARONIL" | "FEMENIL" | "MIXTO"; category: string }>>([
    { modality: "VARONIL", category: "C" },
  ])

  // Club profile form
  const [clubId, setClubId] = useState("")
  const [clubName, setClubName] = useState("")
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
  const [resultTournamentId, setResultTournamentId] = useState("")
  const [resultModality, setResultModality] = useState<"VARONIL" | "FEMENIL" | "MIXTO">("VARONIL")
  const [resultCategory, setResultCategory] = useState("4ta")
  const [resultStage, setResultStage] = useState<typeof resultStageOptions[number]>("CHAMPION")
  const [resultP1Name, setResultP1Name] = useState("")
  const [resultP2Name, setResultP2Name] = useState("")
  const [resultsFile, setResultsFile] = useState<File | null>(null)

  const { data: tournamentsData } = useTournaments({ pageSize: 20, mine: true })
  const createTournament = useCreateTournament()
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

  const tournaments = tournamentsData?.data?.items ?? []
  const myStats = useMemo(() => {
    const active = tournaments.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS").length
    const teams = tournaments.reduce((sum: number, t: any) => sum + (t.registeredTeams || 0), 0)
    return { active, total: tournaments.length, teams }
  }, [tournaments])

  async function publishTournament() {
    await createTournament.mutateAsync({
      name,
      description,
      venue,
      startDate,
      endDate,
      category,
      format,
      type: tournamentType,
      registrationDeadline: registrationDeadline || undefined,
      externalRegistrationType: tournamentType === "BASIC" ? externalRegistrationType : undefined,
      externalRegistrationLink: tournamentType === "BASIC" ? externalRegistrationLink : undefined,
      posterUrl: tournamentType === "BASIC" ? posterUrl : undefined,
      affectsRanking: tournamentType === "BASIC" ? false : true,
      prize,
      sponsorName,
      logoUrl,
      sponsorLogoUrl,
      inscriptionPrice: Number(price),
      modalities: tournamentType === "FULL" ? selectedModalities : undefined,
      rules,
    })
    setShowWizard(false)
  }

  async function saveProfile() {
    if (!clubId) return
    setSavingProfile(true)
    try {
      const response = await fetch("/api/clubs/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName,
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
      subtitle="Panel de gestion del club"
      navItems={navItems}
      activeItem={activeItem}
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
                        <Input placeholder="Ej: Open CDMX 2026" className="bg-background" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Descripción</Label>
                        <Input placeholder="Descripción corta para home y detalle" className="bg-background" value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label>Fecha Inicio</Label>
                          <Input type="date" className="bg-background" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Fecha Fin</Label>
                          <Input type="date" className="bg-background" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label>Tipo de torneo</Label>
                          <Select value={tournamentType} onValueChange={(v: "FULL" | "BASIC") => setTournamentType(v)}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL">FULL</SelectItem>
                              <SelectItem value="BASIC">BASIC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Sede</Label>
                          <Input placeholder="Club / dirección visible" className="bg-background" value={venue} onChange={(e) => setVenue(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Categoría principal</Label>
                          <Select value={category} onValueChange={(v: "A" | "B" | "C") => setCategory(v)}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Fecha límite inscripción</Label>
                        <Input type="date" className="bg-background" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
                      </div>
                      {tournamentType === "BASIC" ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <Label>Tipo de link externo</Label>
                            <Select value={externalRegistrationType} onValueChange={(v: "URL" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "OTHER") => setExternalRegistrationType(v)}>
                              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="URL">URL</SelectItem>
                                <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                                <SelectItem value="INSTAGRAM">INSTAGRAM</SelectItem>
                                <SelectItem value="FACEBOOK">FACEBOOK</SelectItem>
                                <SelectItem value="OTHER">OTHER</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Link de inscripción</Label>
                            <Input placeholder="https://..." className="bg-background" value={externalRegistrationLink} onChange={(e) => setExternalRegistrationLink(e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Cartel (URL)</Label>
                            <Input placeholder="https://.../cartel.jpg" className="bg-background" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} />
                          </div>
                        </>
                      ) : null}
                      <div className="flex flex-col gap-2">
                        <Label>Precio Inscripcion</Label>
                        <Input placeholder="$800 MXN" className="bg-background" value={price} onChange={(e) => setPrice(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Premio</Label>
                        <Input placeholder="$50,000 MXN" className="bg-background" value={prize} onChange={(e) => setPrize(e.target.value)} />
                      </div>
                    </div>
                  )}
                  {wizardStep === 1 && (
                    <div className="flex flex-col gap-4">
                      <Label className="text-base font-semibold">Modalidades y Categorias</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {["VARONIL", "FEMENIL", "MIXTO"].map((mod) => (
                          <Card key={mod} className="cursor-pointer border-2 border-border/50 transition-colors hover:border-primary">
                            <CardContent className="p-4 text-center" onClick={() => setSelectedModalities([{ modality: mod as "VARONIL" | "FEMENIL" | "MIXTO", category }])}>
                              <p className="font-display font-bold text-card-foreground">{mod}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
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
                    <Button className="bg-primary text-primary-foreground" onClick={publishTournament} disabled={createTournament.isPending}>
                      Publicar Torneo
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {section === "perfil" && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Perfil del Club</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Nombre del club</Label><Input value={clubName} onChange={(e) => setClubName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Razon social</Label><Input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></div>
            <div className="space-y-2"><Label>RFC</Label><Input value={clubRfc} onChange={(e) => setClubRfc(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefono del club</Label><Input value={clubPhone} onChange={(e) => setClubPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email del club</Label><Input value={clubEmail} onChange={(e) => setClubEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Sitio web</Label><Input value={clubWebsite} onChange={(e) => setClubWebsite(e.target.value)} /></div>
            <div className="space-y-2"><Label>Contacto responsable</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefono contacto</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email contacto</Label><Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Puesto contacto</Label><Input value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} /></div>
            <div className="space-y-2"><Label>Pais</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
            <div className="space-y-2"><Label>Estado</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
            <div className="space-y-2"><Label>Ciudad</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
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
            <div className="space-y-2"><Label>Canchas interiores</Label><Input type="number" value={indoorCourts} onChange={(e) => setIndoorCourts(e.target.value)} /></div>
            <div className="space-y-2"><Label>Canchas exteriores</Label><Input type="number" value={outdoorCourts} onChange={(e) => setOutdoorCourts(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <Label>Superficies</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {surfaceOptions.map((surface) => (
                  <label key={surface} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={courtSurfaces.includes(surface)}
                      onCheckedChange={(checked) => {
                        setCourtSurfaces((prev) =>
                          checked ? [...new Set([...prev, surface])] : prev.filter((item) => item !== surface)
                        )
                      }}
                    />
                    {surface}
                  </label>
                ))}
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
            <div className="space-y-2 md:col-span-2">
              <ImageUploadField
                label="Logo del club"
                endpoint="/api/uploads/club/logo"
                value={clubLogoUrls}
                onChange={setClubLogoUrls}
              />
            </div>
            <div className="space-y-2 md:col-span-2"><Label>Servicios (separados por coma)</Label><Textarea value={servicesText} onChange={(e) => setServicesText(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <ImageUploadField
                label="Galeria del club"
                endpoint="/api/uploads/club/gallery"
                multiple
                value={galleryUrls}
                onChange={setGalleryUrls}
              />
            </div>
            <div className="space-y-2"><Label>Facebook</Label><Input value={facebook} onChange={(e) => setFacebook(e.target.value)} /></div>
            <div className="space-y-2"><Label>Instagram</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div>
            <div className="space-y-2"><Label>TikTok</Label><Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} /></div>
            <div className="space-y-2"><Label>YouTube</Label><Input value={youtube} onChange={(e) => setYoutube(e.target.value)} /></div>
            <div className="space-y-2"><Label>LinkedIn</Label><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
            <div className="space-y-2"><Label>X</Label><Input value={x} onChange={(e) => setX(e.target.value)} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2 rounded-lg border border-border/50 p-4">
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasParking} onCheckedChange={(v) => setHasParking(Boolean(v))} /> Estacionamiento</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasLockers} onCheckedChange={(v) => setHasLockers(Boolean(v))} /> Vestidores</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasShowers} onCheckedChange={(v) => setHasShowers(Boolean(v))} /> Regaderas</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasCafeteria} onCheckedChange={(v) => setHasCafeteria(Boolean(v))} /> Cafeteria</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasProShop} onCheckedChange={(v) => setHasProShop(Boolean(v))} /> Pro shop</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasLighting} onCheckedChange={(v) => setHasLighting(Boolean(v))} /> Iluminacion</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={hasAirConditioning} onCheckedChange={(v) => setHasAirConditioning(Boolean(v))} /> Aire acondicionado</label>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={acceptsOnlineBooking} onCheckedChange={(v) => setAcceptsOnlineBooking(Boolean(v))} /> Reserva online</label>
            </div>
            <div className="md:col-span-2">
              <Button onClick={saveProfile} disabled={savingProfile} className="bg-primary text-primary-foreground">
                {savingProfile ? "Guardando..." : "Guardar perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <CardHeader><CardTitle>{activeItem}</CardTitle></CardHeader>
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

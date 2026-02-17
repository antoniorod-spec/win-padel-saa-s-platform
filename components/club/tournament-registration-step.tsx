"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  useTournamentTeams,
  useRegisterTeamManual,
  useDeleteTournamentRegistration,
} from "@/hooks/use-tournaments"
import { fetchPlayerByPhone } from "@/lib/api/players"
import { CreatePlayerModal } from "@/components/modals/create-player-modal"
import { ImportTeamsModal } from "@/components/modals/import-teams-modal"
import { Search, UserPlus, Upload, Download, Trash2, FileSpreadsheet } from "lucide-react"

type ModalityOption = {
  id: string
  modality: string
  category: string
}

interface TournamentRegistrationStepProps {
  tournamentId: string
  modalities: ModalityOption[]
  clubId?: string
  maxTeams?: number
  showImportExcel?: boolean
}

type PlayerSelection =
  | { type: "id"; id: string; firstName: string; lastName: string }
  | { type: "phone"; phone: string; firstName?: string; lastName?: string }
  | null

export function TournamentRegistrationStep({
  tournamentId,
  modalities,
  clubId,
  maxTeams = 64,
  showImportExcel = true,
}: TournamentRegistrationStepProps) {
  const { toast } = useToast()
  const [modalityId, setModalityId] = useState("")
  const [player1, setPlayer1] = useState<PlayerSelection>(null)
  const [player2, setPlayer2] = useState<PlayerSelection>(null)
  const [player1Input, setPlayer1Input] = useState("")
  const [player2Input, setPlayer2Input] = useState("")
  const [createPlayerPhone, setCreatePlayerPhone] = useState<string | null>(null)
  const [createPlayerSlot, setCreatePlayerSlot] = useState<"1" | "2">("1")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [modalityFilter, setModalityFilter] = useState<string>("all")

  const registerManual = useRegisterTeamManual()
  const deleteReg = useDeleteTournamentRegistration()
  const { data: teamsRes, isLoading: teamsLoading } = useTournamentTeams(tournamentId)
  const teams = teamsRes?.data ?? []

  const searchByPhone = useCallback(async (phone: string): Promise<{ id: string; firstName: string; lastName: string } | null> => {
    const cleaned = phone.replace(/\D/g, "").trim()
    if (!cleaned || cleaned.length < 10) return null
    const res = await fetchPlayerByPhone(cleaned)
    if (!res?.success || !res?.data) return null
    return res.data as { id: string; firstName: string; lastName: string }
  }, [])

  const handlePlayer1Blur = useCallback(async () => {
    const v = player1Input.trim()
    if (!v) {
      setPlayer1(null)
      return
    }
    const found = await searchByPhone(v)
    if (found) {
      setPlayer1({ type: "id", id: found.id, firstName: found.firstName, lastName: found.lastName })
      setPlayer1Input("")
    } else {
      setPlayer1({ type: "phone", phone: v })
      setCreatePlayerPhone(v)
      setCreatePlayerSlot("1")
    }
  }, [player1Input, searchByPhone])

  const handlePlayer2Blur = useCallback(async () => {
    const v = player2Input.trim()
    if (!v) {
      setPlayer2(null)
      return
    }
    const found = await searchByPhone(v)
    if (found) {
      setPlayer2({ type: "id", id: found.id, firstName: found.firstName, lastName: found.lastName })
      setPlayer2Input("")
    } else {
      setPlayer2({ type: "phone", phone: v })
      setCreatePlayerPhone(v)
      setCreatePlayerSlot("2")
    }
  }, [player2Input, searchByPhone])

  const handlePlayerCreated = useCallback(
    (player: { id: string; firstName: string; lastName: string }) => {
      if (createPlayerSlot === "1") {
        setPlayer1({ type: "id", id: player.id, firstName: player.firstName, lastName: player.lastName })
        setPlayer1Input("")
      } else {
        setPlayer2({ type: "id", id: player.id, firstName: player.firstName, lastName: player.lastName })
        setPlayer2Input("")
      }
      setCreatePlayerPhone(null)
    },
    [createPlayerSlot]
  )

  async function handleAddPair() {
    if (!modalityId) {
      toast({ title: "Selecciona una categoría", variant: "destructive" })
      return
    }
    if (!player1 || !player2) {
      toast({ title: "Selecciona ambos jugadores", variant: "destructive" })
      return
    }

    const p1Payload =
      player1.type === "id"
        ? { playerId: player1.id }
        : {
            phone: player1.phone,
            firstName: (player1.firstName ?? "").trim() || "Jugador",
            lastName: (player1.lastName ?? "").trim() || "1",
          }
    const p2Payload =
      player2.type === "id"
        ? { playerId: player2.id }
        : {
            phone: player2.phone,
            firstName: (player2.firstName ?? "").trim() || "Jugador",
            lastName: (player2.lastName ?? "").trim() || "2",
          }

    try {
      const res = await registerManual.mutateAsync({
        tournamentId,
        data: {
          tournamentModalityId: modalityId,
          player1: p1Payload,
          player2: p2Payload,
        },
      })
      if (!res?.success) throw new Error(res?.error)
      toast({ title: "Pareja agregada correctamente" })
      setPlayer1(null)
      setPlayer2(null)
      setPlayer1Input("")
      setPlayer2Input("")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo agregar la pareja",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(registrationId: string) {
    try {
      const res = await deleteReg.mutateAsync({ tournamentId, registrationId })
      if (!res?.success) throw new Error((res as { error?: string })?.error)
      toast({ title: "Pareja eliminada" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo eliminar",
        variant: "destructive",
      })
    }
  }

  const filteredTeams =
    modalityFilter === "all"
      ? teams
      : teams.filter((t) => {
          const mod = modalities.find((m) => m.id === modalityFilter)
          return mod && mod.modality === t.modality && mod.category === t.category
        })

  const totalCount = teams.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Registro Manual */}
        <div className="lg:col-span-5">
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Registro Manual</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Jugador 1
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Buscar por teléfono o ID..."
                      value={player1Input || (player1?.type === "id" ? `${player1.firstName} ${player1.lastName}` : player1?.type === "phone" ? player1.phone : "")}
                      onChange={(e) => {
                        setPlayer1Input(e.target.value)
                        if (!e.target.value.trim()) setPlayer1(null)
                      }}
                      onBlur={handlePlayer1Blur}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-1">
                    {player1?.type === "id" ? (
                      <span className="text-xs font-medium text-primary">✓ {player1.firstName} {player1.lastName}</span>
                    ) : player1?.type === "phone" ? (
                      <span className="text-xs italic text-amber-600">No registrado - Crear jugador</span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Sin seleccionar</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Jugador 2
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Buscar por teléfono o ID..."
                      value={player2Input || (player2?.type === "id" ? `${player2.firstName} ${player2.lastName}` : player2?.type === "phone" ? player2.phone : "")}
                      onChange={(e) => {
                        setPlayer2Input(e.target.value)
                        if (!e.target.value.trim()) setPlayer2(null)
                      }}
                      onBlur={handlePlayer2Blur}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 px-1">
                    {player2?.type === "id" ? (
                      <span className="text-xs font-medium text-primary">✓ {player2.firstName} {player2.lastName}</span>
                    ) : player2?.type === "phone" ? (
                      <span className="text-xs italic text-amber-600">No registrado - Crear jugador</span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Sin seleccionar</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-semibold">Asignar Categoría</Label>
                <Select value={modalityId} onValueChange={setModalityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.modality} {m.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleAddPair}
                disabled={!modalityId || !player1 || !player2 || registerManual.isPending}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Pareja
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Importar Excel */}
        {showImportExcel && (
          <div className="lg:col-span-7">
            <Card className="border-border/50 flex h-full flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Importar desde Excel</CardTitle>
                </div>
                <Button
                  variant="link"
                  className="text-primary"
                  asChild
                >
                  <a href="/api/tournaments/import/template" download="plantilla-inscripcion-parejas.xlsx">
                    <Download className="mr-1 h-4 w-4" />
                    Descargar Plantilla
                  </a>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div
                  className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/20 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => setImportModalOpen(true)}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold">Arrastra tu archivo aquí</p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    O haz clic para seleccionar (.xlsx, .csv)
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Requisitos del archivo
                  </h4>
                  <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Columnas: Teléfono 1, Teléfono 2
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Categoría debe coincidir
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Máx. 100 parejas por archivo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Formato Excel (.xlsx) o CSV
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Tabla de parejas registradas */}
      <Card className="border-border/50 overflow-hidden">
        <div className="flex flex-col border-b border-border/50 bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Parejas Registradas</h3>
            <Badge variant="secondary" className="text-[10px] font-bold uppercase">
              {totalCount} Parejas
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-4 sm:mt-0">
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {modalities.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.modality} {m.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-bold uppercase">Jugadores</TableHead>
                <TableHead className="text-xs font-bold uppercase">Categoría</TableHead>
                <TableHead className="text-xs font-bold uppercase text-center">Estatus</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay parejas registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams.map((t) => (
                  <TableRow key={t.registrationId} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t.player1} / {t.player2}</span>
                        <span className="text-xs text-muted-foreground">
                          ID: {t.player1Id.slice(-6)} / {t.player2Id.slice(-6)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {t.modality} {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                        ✓ Verificado
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(t.registrationId)}
                          disabled={deleteReg.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-center border-t border-border/50 bg-muted/20 p-4">
          <span className="text-xs font-bold text-muted-foreground">
            {totalCount} / {maxTeams} parejas
          </span>
        </div>
      </Card>

      <CreatePlayerModal
        open={!!createPlayerPhone}
        onOpenChange={(open) => {
          if (!open) {
            setCreatePlayerPhone(null)
            if (createPlayerSlot === "1") {
              setPlayer1(null)
              setPlayer1Input("")
            } else {
              setPlayer2(null)
              setPlayer2Input("")
            }
          }
        }}
        phone={createPlayerPhone ?? ""}
        sourceClubId={clubId}
        onCreated={handlePlayerCreated}
      />

      <ImportTeamsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        tournamentId={tournamentId}
        modalities={modalities}
      />
    </div>
  )
}

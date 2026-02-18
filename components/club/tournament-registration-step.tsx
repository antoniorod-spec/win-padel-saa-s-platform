"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  useTournamentTeams,
  useRegisterTeamManual,
  useDeleteTournamentRegistration,
} from "@/hooks/use-tournaments"
import { PlayerCombobox } from "@/components/club/player-combobox"
import { CreatePlayerModal } from "@/components/modals/create-player-modal"
import {
  ImportTeamsModal,
  type ValidationResult,
} from "@/components/modals/import-teams-modal"
import { ImportValidationScreen } from "@/components/club/import-validation-screen"
import { sanitizeLabel } from "@/lib/utils"
import { formatModalityLabel } from "@/lib/tournament/categories"
import {
  UserPlus,
  Upload,
  Download,
  Trash2,
  Info,
  CloudUpload,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

type PlayerOption = { id: string; firstName: string; lastName: string; fullName: string }

export function TournamentRegistrationStep({
  tournamentId,
  modalities,
  clubId,
  maxTeams = 64,
  showImportExcel = true,
}: TournamentRegistrationStepProps) {
  const { toast } = useToast()
  const [modalityId, setModalityId] = useState("")
  const [player1, setPlayer1] = useState<PlayerOption | null>(null)
  const [player2, setPlayer2] = useState<PlayerOption | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createPhone, setCreatePhone] = useState("")
  const [createName, setCreateName] = useState("")
  const [createSlot, setCreateSlot] = useState<"1" | "2">("1")
  const [createForSystemOnly, setCreateForSystemOnly] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [validationData, setValidationData] = useState<ValidationResult | null>(null)
  const [modalityFilter, setModalityFilter] = useState<string>("all")
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "CONFIRMED">("CONFIRMED")

  const registerManual = useRegisterTeamManual()
  const deleteReg = useDeleteTournamentRegistration()
  const { data: teamsRes, isLoading: teamsLoading } = useTournamentTeams(tournamentId)
  const teams = teamsRes?.data ?? []

  const handleCreateNew = useCallback((slot: "1" | "2", searchText: string) => {
    setCreateSlot(slot)
    const digits = searchText.replace(/\D/g, "")
    if (digits.length >= 10) {
      setCreatePhone(searchText)
      setCreateName("")
    } else {
      setCreateName(searchText)
      setCreatePhone("")
    }
    setCreateModalOpen(true)
  }, [])

  const handlePlayerCreated = useCallback(
    (player: { id: string; firstName: string; lastName: string }) => {
      if (createForSystemOnly) {
        setCreateModalOpen(false)
        setCreateForSystemOnly(false)
        toast({
          title: "Jugador añadido al sistema",
          description: "Puedes seleccionarlo en el formulario Individual al inscribir una pareja.",
        })
        return
      }
      const opt: PlayerOption = {
        ...player,
        fullName: `${player.firstName} ${player.lastName}`,
      }
      if (createSlot === "1") setPlayer1(opt)
      else setPlayer2(opt)
      setCreateModalOpen(false)
      setCreatePhone("")
      setCreateName("")
      toast({ title: "Jugador creado" })
    },
    [createSlot, createForSystemOnly, toast]
  )

  function handleSwap() {
    setPlayer1(player2)
    setPlayer2(player1)
  }

  async function handleAddPair() {
    if (!modalityId) {
      toast({ title: "Selecciona una categoría", variant: "destructive" })
      return
    }
    if (!player1 || !player2) {
      toast({ title: "Selecciona ambos jugadores", variant: "destructive" })
      return
    }
    if (player1.id === player2.id) {
      toast({ title: "Los jugadores deben ser diferentes", variant: "destructive" })
      return
    }

    try {
      const res = await registerManual.mutateAsync({
        tournamentId,
        data: {
          tournamentModalityId: modalityId,
          player1: { playerId: player1.id },
          player2: { playerId: player2.id },
          paymentStatus,
        },
      })
      if (!res?.success) throw new Error(res?.error)
      toast({ title: "Pareja agregada" })
      setPlayer1(null)
      setPlayer2(null)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo agregar",
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
      : teams.filter((t: any) => {
          const mod = modalities.find((m) => m.id === modalityFilter)
          return mod && mod.modality === t.modality && mod.category === t.category
        })

  const totalCount = teams.length

  // ModalityId -> Set de playerIds ya inscritos en esa categoría
  const playersByModality = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const t of teams as Array<{ tournamentModalityId?: string; player1Id: string; player2Id: string }>) {
      const modId = t.tournamentModalityId ?? modalities.find((m) => m.modality === (t as any).modality && m.category === (t as any).category)?.id
      if (!modId) continue
      let set = map.get(modId)
      if (!set) {
        set = new Set()
        map.set(modId, set)
      }
      set.add(t.player1Id)
      set.add(t.player2Id)
    }
    return map
  }, [teams, modalities])

  // Categorías disponibles: excluir aquellas donde algún jugador seleccionado ya está inscrito
  const availableModalities = useMemo(() => {
    if (!player1 && !player2) return modalities
    const p1Id = player1?.id
    const p2Id = player2?.id
    return modalities.filter((m) => {
      const registered = playersByModality.get(m.id)
      if (!registered) return true
      if (p1Id && registered.has(p1Id)) return false
      if (p2Id && registered.has(p2Id)) return false
      return true
    })
  }, [modalities, playersByModality, player1?.id, player2?.id])

  const isSelectedModalityInvalid = useMemo(() => {
    if (!modalityId) return false
    const registered = playersByModality.get(modalityId)
    if (!registered) return false
    if (player1?.id && registered.has(player1.id)) return true
    if (player2?.id && registered.has(player2.id)) return true
    return false
  }, [modalityId, playersByModality, player1?.id, player2?.id])

  // Si la categoría seleccionada ya no está disponible (jugador ya inscrito), limpiarla
  useEffect(() => {
    if (modalityId && (isSelectedModalityInvalid || !availableModalities.some((m) => m.id === modalityId))) {
      setModalityId("")
    }
  }, [modalityId, isSelectedModalityInvalid, availableModalities])

  const shortId = (id: string) => id?.slice(-4) ?? "—"

  if (validationData) {
    return (
      <ImportValidationScreen
        tournamentId={tournamentId}
        modalities={modalities}
        validationData={validationData}
        clubId={clubId}
        onCancel={() => setValidationData(null)}
        onSuccess={() => {}}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Columna izquierda: formulario + tabs según stitch */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-200 rounded-2xl shadow-sm p-0 overflow-hidden">
            <Tabs defaultValue="individual" className="w-full">
              <div className="flex border-b border-slate-100">
                <TabsList className="w-full h-auto flex rounded-none border-0 bg-transparent p-0">
                  <TabsTrigger
                    value="individual"
                    className="flex-1 py-4 text-[11px] font-bold uppercase tracking-wider rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600"
                  >
                    Individual
                  </TabsTrigger>
                  <TabsTrigger
                    value="masiva"
                    className="flex-1 py-4 text-[11px] font-bold uppercase tracking-wider rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-600"
                  >
                    Masiva
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="p-6">
                <TabsContent value="individual" className="mt-0 space-y-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddPair()
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Jugador 1 (RPM-ID / Celular / Nombre)
                      </label>
                      <PlayerCombobox
                        value={player1}
                        onSelect={setPlayer1}
                        onCreateNew={(t) => handleCreateNew("1", t)}
                        placeholder="Buscar jugador..."
                        className="w-full h-10 rounded-lg border-slate-200"
                        excludePlayerId={player2?.id}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Si no existe, el sistema solicitará registro rápido.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Jugador 2 (Pareja)
                      </label>
                      <PlayerCombobox
                        value={player2}
                        onSelect={setPlayer2}
                        onCreateNew={(t) => handleCreateNew("2", t)}
                        placeholder="Buscar pareja..."
                        className="w-full h-10 rounded-lg border-slate-200"
                        excludePlayerId={player1?.id}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Categoría
                        </label>
                        <Select value={modalityId} onValueChange={setModalityId}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 focus:ring-primary">
                            <SelectValue placeholder="Categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModalities.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {sanitizeLabel(formatModalityLabel(m.modality, m.category))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Estatus de Pago
                        </label>
                        <Select
                          value={paymentStatus}
                          onValueChange={(v) => setPaymentStatus(v as "PENDING" | "CONFIRMED")}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="CONFIRMED">Pagado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-[#00B049] text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all uppercase tracking-wider h-auto"
                        disabled={!modalityId || !player1 || !player2 || isSelectedModalityInvalid || registerManual.isPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inscribir Pareja
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="masiva" className="mt-0">
                  <div className="mt-0 pt-10 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Upload className="h-5 w-5 text-primary" />
                      <h3 className="text-sm font-bold text-slate-900">Subida Masiva</h3>
                    </div>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group mb-4"
                      onClick={() => setImportModalOpen(true)}
                    >
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <CloudUpload className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-1">Arrastra tu archivo aquí</p>
                      <p className="text-[10px] text-slate-400">Soportado: .XLSX, .CSV (Máx. 5MB)</p>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <a
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        href="/api/tournaments/import/template"
                        download="plantilla-inscripcion-parejas.xlsx"
                      >
                        <Download className="h-3.5 w-3.5" />
                        DESCARGAR PLANTILLA
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-bold uppercase tracking-wider h-8 gap-1.5"
                        onClick={() => {
                          setCreateForSystemOnly(true)
                          setCreatePhone("")
                          setCreateName("")
                          setCreateModalOpen(true)
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Añadir jugador al sistema
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-4">
                      Añade jugadores al sistema para poder seleccionarlos después en el formulario Individual.
                    </p>
                    <Button
                      className="w-full bg-primary hover:bg-[#00B049] text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all uppercase tracking-wider"
                      onClick={() => setImportModalOpen(true)}
                    >
                      CARGAR Y PROCESAR EXCEL
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* Info card oscura según stitch */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold">Info de Registro</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Las inscripciones manuales no generan comisión por pasarela de pago, pero sí consumen un
              crédito de registro del Ranking MX.
            </p>
          </div>
        </div>

        {/* Columna derecha: tabla de parejas inscritas */}
        <div className="lg:col-span-8">
          <Card className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/50">
                  <span className="text-xs font-bold text-slate-600">📋</span>
                </div>
                <h2 className="text-sm font-bold text-slate-900">Parejas Inscritas Recientemente</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {showImportExcel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-bold uppercase tracking-wider h-8"
                    onClick={() => setImportModalOpen(true)}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Importar Excel
                  </Button>
                )}
                <Select value={modalityFilter} onValueChange={setModalityFilter}>
                  <SelectTrigger className="h-8 w-40 text-xs rounded-lg border-slate-200">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {modalities.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {sanitizeLabel(formatModalityLabel(m.modality, m.category))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50">
                    <TableHead className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pareja / Jugadores
                    </TableHead>
                    <TableHead className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Categoría
                    </TableHead>
                    <TableHead className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Registro
                    </TableHead>
                    <TableHead className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Estatus
                    </TableHead>
                    <TableHead className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : filteredTeams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                        No hay parejas inscritas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeams.map((t: any) => (
                      <TableRow key={t.registrationId} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-800">
                              {t.player1} <span className="text-slate-400 font-normal">/</span> {t.player2}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">
                              ID: {shortId(t.player1Id)} • ID: {shortId(t.player2Id)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-600">
                            {sanitizeLabel(formatModalityLabel(t.modality, t.category))}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <p className="text-xs text-slate-500">
                            {t.registeredAt
                              ? format(new Date(t.registeredAt), "d MMM, HH:mm", { locale: es })
                              : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span
                            className={
                              t.paymentStatus === "CONFIRMED"
                                ? "bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                : "bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            }
                          >
                            {t.paymentStatus === "CONFIRMED" ? "Pagado" : "Pendiente"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-green-700 text-xs font-bold uppercase tracking-tighter h-auto p-0"
                            onClick={() => handleDelete(t.registrationId)}
                            disabled={deleteReg.isPending}
                            aria-label="Eliminar pareja"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {totalCount} / {maxTeams} parejas
              </span>
            </div>
          </Card>
        </div>
      </div>

      <CreatePlayerModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) setCreateForSystemOnly(false)
        }}
        phone={createPhone}
        initialName={createName}
        sourceClubId={clubId}
        onCreated={handlePlayerCreated}
      />

      <ImportTeamsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        tournamentId={tournamentId}
        modalities={modalities}
        onValidationComplete={(data) => setValidationData(data)}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useImportValidatedRows } from "@/hooks/use-tournaments"
import { CreatePlayerModal } from "@/components/modals/create-player-modal"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  UserPlus,
  RefreshCw,
  ChevronDown,
} from "lucide-react"
import { sanitizeLabel } from "@/lib/utils"

type ValidatedRowValid = {
  rowIndex: number
  status: "valid"
  player1: string
  player2: string
  player1Id: string
  player2Id: string
  modalityId: string
  modalityLabel: string
  p1Phone: string
  p2Phone: string
}

type ValidatedRowWarning = {
  rowIndex: number
  status: "warning"
  player1: string
  player2: string
  player1Id?: string
  player2Id?: string
  modalityId?: string
  modalityLabel?: string
  reason: string
  p1Phone: string
  p2Phone: string
}

type ValidatedRowError = {
  rowIndex: number
  status: "error"
  player1?: string
  player2?: string
  reason: string
  p1Phone?: string
  p2Phone?: string
  missingField?: string
}

type ValidationData = {
  fileName: string
  valid: ValidatedRowValid[]
  warnings: ValidatedRowWarning[]
  errors: ValidatedRowError[]
  totalRows: number
}

interface ImportValidationScreenProps {
  tournamentId: string
  modalities: Array<{ id: string; modality: string; category: string }>
  validationData: ValidationData
  clubId?: string
  onCancel: () => void
  onSuccess?: () => void
}

export function ImportValidationScreen({
  tournamentId,
  modalities,
  validationData,
  clubId,
  onCancel,
  onSuccess,
}: ImportValidationScreenProps) {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForRow, setCreateForRow] = useState<ValidatedRowError | null>(null)
  const [createSlot, setCreateSlot] = useState<"1" | "2">("1")
  const [fixedRows, setFixedRows] = useState<Map<number, ValidatedRowValid>>(new Map())

  const importValidated = useImportValidatedRows()

  const { valid, warnings, errors, fileName, totalRows } = validationData

  const importableRows = [
    ...valid,
    ...warnings.filter((w) => w.player1Id && w.player2Id && w.modalityId),
    ...Array.from(fixedRows.values()),
  ]
  const uniqueImportable = importableRows.filter(
    (r, i, arr) => arr.findIndex((x) => x.player1Id === r.player1Id && x.player2Id === r.player2Id && x.modalityId === r.modalityId) === i
  )

  const fixedAsValid = Array.from(fixedRows.values()).filter((r) => r.player1Id && r.player2Id && r.modalityId)
  const errorRowsFiltered = errors.filter((e) => !fixedRows.has(e.rowIndex) || !(fixedRows.get(e.rowIndex)?.player1Id && fixedRows.get(e.rowIndex)?.player2Id))

  const rowsToShow = [...valid, ...fixedAsValid, ...warnings, ...errorRowsFiltered].filter((r) => {
    if (statusFilter === "all") return true
    if (statusFilter === "valid") return r.status === "valid" || ("player1Id" in r && r.player1Id && r.player2Id)
    if (statusFilter === "warnings") return r.status === "warning"
    if (statusFilter === "errors") return r.status === "error"
    return true
  })

  const handleRegistroRapido = (row: ValidatedRowError, slot: "1" | "2") => {
    setCreateForRow(row)
    setCreateSlot(slot)
    setCreateModalOpen(true)
  }

  const handlePlayerCreated = (player: { id: string; firstName: string; lastName: string }) => {
    if (!createForRow) return
    const defaultModality = modalities[0]
    setFixedRows((prev) => {
      const next = new Map(prev)
      const existing = next.get(createForRow!.rowIndex)
      const base = existing ?? {
        rowIndex: createForRow!.rowIndex,
        status: "valid" as const,
        player1: createForRow!.player1 ?? "",
        player2: createForRow!.player2 ?? "",
        player1Id: "",
        player2Id: "",
        modalityId: defaultModality?.id ?? "",
        modalityLabel: defaultModality ? `${defaultModality.category} ${defaultModality.modality}` : "",
        p1Phone: createForRow!.p1Phone ?? "",
        p2Phone: createForRow!.p2Phone ?? "",
      }
      if (createSlot === "1") {
        next.set(createForRow!.rowIndex, { ...base, player1Id: player.id, player1: `${player.firstName} ${player.lastName}` })
      } else {
        next.set(createForRow!.rowIndex, { ...base, player2Id: player.id, player2: `${player.firstName} ${player.lastName}` })
      }
      return next
    })
    setCreateModalOpen(false)
    setCreateForRow(null)
    toast({ title: "Jugador creado. Crea el otro si falta." })
  }

  const handleConfirmImport = async () => {
    const rows: Array<{ player1Id: string; player2Id: string; tournamentModalityId: string }> = uniqueImportable
      .filter((r) => r.player1Id && r.player2Id && r.modalityId)
      .map((r) => ({
        player1Id: r.player1Id!,
        player2Id: r.player2Id!,
        tournamentModalityId: r.modalityId!,
      }))

    if (rows.length === 0) {
      toast({ title: "No hay parejas válidas para importar", variant: "destructive" })
      return
    }

    try {
      const res = await importValidated.mutateAsync({ tournamentId, rows })
      if (!res?.success) throw new Error(res?.error)
      toast({ title: `${rows.length} pareja${rows.length !== 1 ? "s" : ""} importada${rows.length !== 1 ? "s" : ""} correctamente` })
      onSuccess?.()
      onCancel()
    } catch (err) {
      toast({
        title: "Error al importar",
        description: err instanceof Error ? err.message : "No se pudo completar",
        variant: "destructive",
      })
    }
  }

  const downloadErrorReport = () => {
    const lines = [
      "Fila,Estado,Jugador 1,Jugador 2,Teléfono 1,Teléfono 2,Categoría,Mensaje",
      ...errors.map(
        (e) =>
          `${e.rowIndex},Error,"${e.player1 ?? ""}","${e.player2 ?? ""}","${e.p1Phone ?? ""}","${e.p2Phone ?? ""}","","${e.reason}"`
      ),
      ...warnings.map(
        (w) =>
          `${w.rowIndex},Advertencia,"${w.player1}","${w.player2}","${w.p1Phone}","${w.p2Phone}","${w.modalityLabel ?? ""}","${w.reason}"`
      ),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `errores-importacion-${fileName.replace(/\.[^.]+$/, "")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = valid.length + fixedAsValid.length
  const warningCount = warnings.length
  const errorCount = errors.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Validación y Mapeo</h1>
        <p className="text-slate-600 mt-1">
          Revisa y corrige los datos de las parejas antes de finalizar el registro al torneo.
        </p>
      </div>

      {/* Barra de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border-l-8 border-primary shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Parejas Válidas</p>
            <p className="text-3xl font-bold text-slate-900">{validCount}</p>
            <p className="text-green-600 text-sm font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Listas para importar
            </p>
          </div>
          <div className="bg-primary/10 p-4 rounded-full">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-8 border-amber-400 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Con Advertencias</p>
            <p className="text-3xl font-bold text-slate-900">{warningCount}</p>
            <p className="text-amber-600 text-sm font-medium mt-1">Requiere revisión manual</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-full">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-8 border-red-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Errores Críticos</p>
            <p className="text-3xl font-bold text-slate-900">{errorCount}</p>
            <p className="text-red-600 text-sm font-medium mt-1">Jugador no en plataforma</p>
          </div>
          <div className="bg-red-50 p-4 rounded-full">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">Detalle de Registros ({totalRows})</h3>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={downloadErrorReport} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Reporte de Errores
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="valid">Sólo válidos</SelectItem>
                <SelectItem value="warnings">Sólo advertencias</SelectItem>
                <SelectItem value="errors">Sólo errores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-100">
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Pareja (Jugadores)
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Teléfono / ID
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Categoría
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Estatus
                </TableHead>
                <TableHead className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsToShow.map((row) => {
                if (row.status === "valid") {
                  const r = row as ValidatedRowValid
                  return (
                    <TableRow key={`valid-${r.rowIndex}`} className="hover:bg-slate-50/50">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{r.player1} / {r.player2}</p>
                            <p className="text-xs text-slate-500">Importado desde: {fileName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <p className="text-slate-600 font-medium">{r.p1Phone} • {r.p2Phone}</p>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                          {sanitizeLabel(r.modalityLabel)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <span className="text-green-600 text-sm font-medium">Listo para importar</span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right" />
                    </TableRow>
                  )
                }
                if (row.status === "warning") {
                  const r = row as ValidatedRowWarning
                  return (
                    <TableRow key={`warn-${r.rowIndex}`} className="bg-amber-50/20 hover:bg-amber-50/40">
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{r.player1} / {r.player2}</p>
                            <p className="text-xs text-slate-500">Mapeo automático fallido</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <p className="text-slate-600 font-medium">{r.p1Phone} • {r.p2Phone}</p>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <span className="bg-amber-100 px-3 py-1 rounded-full text-xs font-bold text-amber-700">
                          {r.modalityLabel ?? "No detectada"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <p className="text-amber-700 text-sm font-medium">{r.reason}</p>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1">
                          Reasignar
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }
                const r = row as ValidatedRowError
                const fixed = fixedRows.get(r.rowIndex)
                const needsJ1 = !fixed?.player1Id
                const needsJ2 = !fixed?.player2Id
                const statusText = needsJ1 && needsJ2
                  ? r.reason
                  : needsJ1
                    ? "Falta registrar Jugador 1"
                    : "Falta registrar Jugador 2"
                return (
                  <TableRow key={`err-${r.rowIndex}`} className="bg-red-50/20 hover:bg-red-50/40">
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {fixed?.player1 ?? r.player1 ?? "—"} / {fixed?.player2 ?? r.player2 ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500">Jugador no en plataforma</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-red-600 font-bold">{r.p1Phone ?? "—"} • {r.p2Phone ?? "—"}</p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-400 italic">
                        No detectada
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-red-700 text-sm font-bold">{statusText}</p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex gap-2 flex-wrap">
                        {needsJ1 && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white gap-1"
                            onClick={() => handleRegistroRapido(r, "1")}
                          >
                            <UserPlus className="h-4 w-4" />
                            Registro Rápido (J1)
                          </Button>
                        )}
                        {needsJ2 && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white gap-1"
                            onClick={() => handleRegistroRapido(r, "2")}
                          >
                            <UserPlus className="h-4 w-4" />
                            Registro Rápido (J2)
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onCancel} className="font-bold">
              Anular Carga
            </Button>
            <div className="hidden md:block">
              <p className="text-xs text-slate-500 font-bold uppercase">Archivo seleccionado</p>
              <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{fileName}</p>
            </div>
          </div>
          <Button
            onClick={handleConfirmImport}
            disabled={validCount === 0 || importValidated.isPending}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 gap-2"
          >
            {importValidated.isPending ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                CONFIRMAR E IMPORTAR {validCount} PAREJA{validCount !== 1 ? "S" : ""}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="h-24" />

      <CreatePlayerModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) setCreateForRow(null)
        }}
        phone={createSlot === "1" ? (createForRow?.p1Phone ?? "") : (createForRow?.p2Phone ?? "")}
        initialName={createSlot === "1" ? (createForRow?.player1 ?? "") : (createForRow?.player2 ?? "")}
        sourceClubId={clubId}
        onCreated={handlePlayerCreated}
      />
    </div>
  )
}

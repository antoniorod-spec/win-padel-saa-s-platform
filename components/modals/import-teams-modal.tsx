"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useImportTournamentFile } from "@/hooks/use-tournaments"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, Calendar, LayoutGrid } from "lucide-react"
import * as XLSX from "xlsx"

type ModalityOption = {
  id: string
  modality: string
  category: string
}

interface ImportTeamsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  modalities: ModalityOption[]
  onSuccess?: () => void
  onGoToSchedule?: () => void
  onGoToBracket?: () => void
}

function parseFileClient(file: File): Promise<Array<Record<string, string>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return reject(new Error("No se pudo leer el archivo"))
        const workbook = XLSX.read(data, { type: "binary" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
        const normalized = rows.map((row) => {
          const out: Record<string, string> = {}
          for (const [k, v] of Object.entries(row)) {
            const key = String(k)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "")
            out[key] = v != null ? String(v).trim() : ""
          }
          return out
        })
        resolve(normalized)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Error al leer el archivo"))
    reader.readAsBinaryString(file)
  })
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ""
}

export function ImportTeamsModal({
  open,
  onOpenChange,
  tournamentId,
  modalities,
  onSuccess,
  onGoToSchedule,
  onGoToBracket,
}: ImportTeamsModalProps) {
  const { toast } = useToast()
  const [modalityId, setModalityId] = useState("")
  const [importType, setImportType] = useState<"players" | "pairs">("pairs")
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importResult, setImportResult] = useState<{
    importedRows: number
    failedRows: number
    totalRows: number
  } | null>(null)

  const importer = useImportTournamentFile()

  useEffect(() => {
    if (!open) setImportResult(null)
  }, [open])

  const handleFile = useCallback(async (f: File | null) => {
    setFile(f)
    setParsedRows([])
    if (!f) return
    try {
      const rows = await parseFileClient(f)
      setParsedRows(rows)
    } catch {
      toast({ title: "Error al leer el archivo", variant: "destructive" })
    }
  }, [toast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"))) {
        handleFile(f)
      } else {
        toast({ title: "Formato no válido. Usa .xlsx o .csv", variant: "destructive" })
      }
    },
    [handleFile, toast]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  async function onSubmit() {
    if (!file) return
    if (importType === "pairs" && !modalityId && modalities.length > 1) {
      // Importación global: requiere columna Categoría en el Excel
    }
    if (importType === "players" && !modalityId) {
      toast({ title: "Selecciona una categoría", variant: "destructive" })
      return
    }

    const result = await importer.mutateAsync({
      tournamentId,
      ...(modalityId ? { tournamentModalityId: modalityId } : {}),
      importType,
      file,
    })

    if (!result?.success) {
      toast({ title: result?.error || "No se pudo importar", variant: "destructive" })
      return
    }

    const data = result.data as { importedRows?: number; failedRows?: number; totalRows?: number }
    setImportResult({
      importedRows: data.importedRows ?? 0,
      failedRows: data.failedRows ?? 0,
      totalRows: data.totalRows ?? 0,
    })
    onSuccess?.()
  }

  const readyCount = importType === "pairs"
    ? parsedRows.filter((row) => {
        const p1 = pick(row, ["player1_phone", "telefono1", "celular1", "telefono_j1"])
        const p2 = pick(row, ["player2_phone", "telefono2", "celular2", "telefono_j2"])
        const p1Name = pick(row, ["player1_first_name", "nombre1", "player1_name", "nombre_j1"])
        const p2Name = pick(row, ["player2_first_name", "nombre2", "player2_name", "nombre_j2"])
        return p1 && p2 && (p1Name || p2Name)
      }).length
    : parsedRows.length

  const errorCount = parsedRows.length - readyCount

  function handleClose(open: boolean) {
    if (!open) {
      setImportResult(null)
      setFile(null)
      setParsedRows([])
    }
    onOpenChange(open)
  }

  if (importResult) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">¡Importación completada!</h2>
              <p className="text-sm text-muted-foreground">
                Los datos se han procesado correctamente.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">{importResult.importedRows}</p>
                <p className="text-xs font-medium text-muted-foreground">Parejas añadidas</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">{importResult.failedRows}</p>
                <p className="text-xs font-medium text-muted-foreground">Con errores</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold">{importResult.totalRows}</p>
                <p className="text-xs font-medium text-muted-foreground">Total procesadas</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 w-full">
              {onGoToSchedule && (
                <Button onClick={() => { onGoToSchedule(); handleClose(false); }} className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Ir al Rol de Juegos
                </Button>
              )}
              {onGoToBracket && (
                <Button variant="outline" onClick={() => { onGoToBracket(); handleClose(false); }} className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Ver Cuadros
                </Button>
              )}
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <DialogTitle>Importar desde Excel/CSV</DialogTitle>
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
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría (opcional para importación global)</Label>
              <Select value={modalityId} onValueChange={setModalityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas (usa columna Categoría)" />
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
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={importType} onValueChange={(v: "players" | "pairs") => setImportType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="players">Solo jugadores</SelectItem>
                  <SelectItem value="pairs">Parejas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/30"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("import-file-input")?.click()}
          >
            <input
              id="import-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">Arrastra tu archivo aquí</p>
            <p className="mt-1 text-sm text-muted-foreground">O haz clic para seleccionar (.xlsx, .csv)</p>
            {file && <p className="mt-2 text-xs text-primary font-medium">{file.name}</p>}
          </div>

          {parsedRows.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <h3 className="font-semibold">Lista de validación</h3>
                <div className="flex gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">
                    Total: {parsedRows.length}
                  </span>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                    Listos: {readyCount}
                  </span>
                  {errorCount > 0 && (
                    <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-bold">
                      Errores: {errorCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Jugador 1</TableHead>
                      <TableHead className="text-xs">Jugador 2</TableHead>
                      {importType === "pairs" ? <TableHead className="text-xs">Categoría</TableHead> : null}
                      <TableHead className="text-xs text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 20).map((row, i) => {
                      const p1 = pick(row, ["player1_phone", "telefono1", "celular1", "telefono_j1"])
                      const p2 = pick(row, ["player2_phone", "telefono2", "celular2", "telefono_j2"])
                      const p1Name = pick(row, ["player1_first_name", "nombre1", "player1_name", "nombre_j1"])
                      const p2Name = pick(row, ["player2_first_name", "nombre2", "player2_name", "nombre_j2"])
                      const cat = pick(row, ["categoria", "category"])
                      const ok = p1 && p2 && (p1Name || p2Name)
                      return (
                        <TableRow key={i} className={!ok ? "bg-destructive/5" : ""}>
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          <TableCell className="text-xs">{p1Name || p1 || "-"}</TableCell>
                          <TableCell className="text-xs">{p2Name || p2 || "-"}</TableCell>
                          {importType === "pairs" ? <TableCell className="text-xs">{cat || "-"}</TableCell> : null}
                          <TableCell className="text-center">
                            {ok ? (
                              <CheckCircle className="mx-auto h-4 w-4 text-primary" />
                            ) : (
                              <AlertCircle className="mx-auto h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {parsedRows.length > 20 && (
                <p className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Mostrando 20 de {parsedRows.length} filas
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Requisitos del archivo
            </h4>
            <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2">✓ Teléfono 1 y Teléfono 2 obligatorios</li>
              <li className="flex items-center gap-2">✓ Categoría debe coincidir (o columna Categoría)</li>
              <li className="flex items-center gap-2">✓ Máx. 100 parejas por archivo</li>
              <li className="flex items-center gap-2">✓ Formato Excel (.xlsx) o CSV</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!file || importer.isPending || (importType === "players" && !modalityId)}
          >
            {importer.isPending ? "Importando..." : importType === "pairs" ? "Confirmar y Añadir Parejas" : "Confirmar e Importar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

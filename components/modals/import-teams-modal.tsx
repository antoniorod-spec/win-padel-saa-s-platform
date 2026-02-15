"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useImportTournamentFile } from "@/hooks/use-tournaments"

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
}

export function ImportTeamsModal({
  open,
  onOpenChange,
  tournamentId,
  modalities,
}: ImportTeamsModalProps) {
  const [modalityId, setModalityId] = useState("")
  const [importType, setImportType] = useState<"players" | "pairs">("pairs")
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState("")
  const importer = useImportTournamentFile()

  async function onSubmit() {
    if (!file || !modalityId) return
    setFeedback("")
    const result = await importer.mutateAsync({
      tournamentId,
      tournamentModalityId: modalityId,
      importType,
      file,
    })

    if (!result?.success) {
      setFeedback(result?.error || "No se pudo importar el archivo")
      return
    }

    setFeedback(
      `Importacion completada. Filas importadas: ${result.data.importedRows}, fallidas: ${result.data.failedRows}.`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar jugadores o parejas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Modalidad</Label>
            <Select value={modalityId} onValueChange={setModalityId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona modalidad" />
              </SelectTrigger>
              <SelectContent>
                {modalities.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.category} {m.modality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de importacion</Label>
            <Select value={importType} onValueChange={(v: "players" | "pairs") => setImportType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="players">Solo jugadores</SelectItem>
                <SelectItem value="pairs">Parejas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Archivo CSV o XLSX</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

          <Button onClick={onSubmit} disabled={!file || !modalityId || importer.isPending}>
            {importer.isPending ? "Importando..." : "Importar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

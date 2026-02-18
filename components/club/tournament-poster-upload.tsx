"use client"

import { useRef, useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TournamentPosterUploadProps {
  endpoint: string
  value: string
  onChange: (url: string) => void
}

export function TournamentPosterUpload({
  endpoint,
  value,
  onChange,
}: TournamentPosterUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", files[0])
      const response = await fetch(endpoint, { method: "POST", body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error al subir")
      const url = payload.data?.publicUrl
      if (url) onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`
          relative border-2 border-dashed rounded-2xl min-h-[180px] flex flex-col items-center justify-center
          transition-all cursor-pointer group
          ${value
            ? "border-slate-200 bg-slate-50/50"
            : dragOver
              ? "border-primary bg-primary/5"
              : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ""
          }}
          disabled={uploading}
        />

        {value ? (
          <div className="relative w-full h-full min-h-[180px] p-4">
            <img
              src={value}
              alt="Cartel"
              className="w-full h-40 object-contain rounded-lg"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Quitar
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div
              className={`
                w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4
                transition-all
                ${dragOver ? "bg-primary/20 text-primary scale-110" : "bg-white shadow-sm text-slate-400 group-hover:text-primary group-hover:scale-110"}
              `}
            >
              <Upload className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Haz clic o arrastra el cartel aquí
            </p>
            <p className="text-xs text-slate-500 mt-2">
              JPG, PNG (Max. 5MB). Relación sugerida: 4:5
            </p>
            {uploading && (
              <p className="text-xs text-primary font-medium mt-2">Subiendo...</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

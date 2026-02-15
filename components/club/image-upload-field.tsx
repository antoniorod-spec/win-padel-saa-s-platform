"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ImageUploadFieldProps {
  label: string
  endpoint: string
  multiple?: boolean
  value: string[]
  onChange: (urls: string[]) => void
}

export function ImageUploadField({
  label,
  endpoint,
  multiple = false,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      if (multiple) {
        Array.from(files).forEach((file) => formData.append("files", file))
      } else {
        formData.append("file", files[0])
      }
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Error al subir imagen")

      if (multiple) {
        const uploaded = Array.isArray(payload.data)
          ? payload.data
              .map((item: { publicUrl?: unknown }) =>
                typeof item.publicUrl === "string" ? item.publicUrl : null
              )
              .filter((url: string | null): url is string => Boolean(url))
          : []
        onChange([...value, ...uploaded])
      } else {
        const uploadedUrl = payload.data?.publicUrl
        onChange(uploadedUrl ? [uploadedUrl] : [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? <p className="text-xs text-muted-foreground">Subiendo...</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {value.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-3">
          {value.map((url) => (
            <div key={url} className="space-y-1">
              <img src={url} alt="Uploaded" className="h-24 w-full rounded border border-border object-cover" />
              <Button type="button" size="sm" variant="outline" onClick={() => onChange(value.filter((item) => item !== url))}>
                Quitar
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

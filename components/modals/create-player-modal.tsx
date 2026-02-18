"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { createPlayerFromPhone } from "@/lib/api/players"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { CATEGORIES_VARONIL_FEMENIL, getCategoryLabel } from "@/lib/tournament/categories"

interface CreatePlayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phone?: string
  /** Nombre pre-rellenado cuando se crea desde búsqueda por nombre */
  initialName?: string
  sourceClubId?: string
  onCreated: (player: { id: string; firstName: string; lastName: string }) => void
}

export function CreatePlayerModal({
  open,
  onOpenChange,
  phone = "",
  initialName = "",
  sourceClubId,
  onCreated,
}: CreatePlayerModalProps) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState("")
  const [phoneInput, setPhoneInput] = useState(phone)
  const [sex, setSex] = useState<"M" | "F">("M")
  const [category, setCategory] = useState<string>("")
  const [email, setEmail] = useState("")
  const [sendWhatsAppInvite, setSendWhatsAppInvite] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setPhoneInput(phone)
      setFullName(initialName)
    }
  }, [open, phone, initialName])

  const categoryOptions = [...CATEGORIES_VARONIL_FEMENIL]

  function toWhatsAppNumber(phone: string): string {
    const digits = phone.replace(/\D+/g, "")
    if (digits.length >= 12 && digits.startsWith("52")) return digits
    if (digits.length === 10) return `52${digits}`
    if (digits.length === 11 && digits.startsWith("1")) return `52${digits.slice(1)}`
    return digits ? `52${digits}` : ""
  }

  function openWhatsAppInvite(num: string, firstName: string) {
    const waNum = toWhatsAppNumber(num)
    if (!waNum) return
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const message = `Hola ${firstName}! Te registré en WhinPadel. Completa tu perfil aquí: ${baseUrl}/registro`
    const url = `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  function parseFullName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return { firstName: "", lastName: "" }
    if (parts.length === 1) return { firstName: parts[0], lastName: "" }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { firstName, lastName } = parseFullName(fullName)
    if (!firstName.trim()) {
      toast({ title: "Nombre requerido", variant: "destructive" })
      return
    }
    if (!phoneInput.trim()) {
      toast({ title: "WhatsApp / Teléfono requerido", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await createPlayerFromPhone({
        phone: phoneInput.trim() || phone,
        firstName: firstName.trim(),
        lastName: lastName.trim() || firstName.trim(),
        email: email.trim() || undefined,
        sex,
        suggestedCategory: category.trim() || undefined,
        sourceClubId,
      })
      if (!res?.success || !res?.data) throw new Error(res?.error || "Error al crear")
      onCreated({
        id: res.data.id,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
      })
      onOpenChange(false)
      if (sendWhatsAppInvite) {
        openWhatsAppInvite(phoneInput.trim(), res.data.firstName)
      }
      setFullName("")
      setPhoneInput(phone)
      setCategory("")
      setEmail("")
      setSendWhatsAppInvite(false)
      toast({ title: "Jugador creado correctamente" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo crear el jugador",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-start gap-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Nuevo Jugador
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {initialName ? "Completa los datos del nuevo jugador" : "El número no está registrado en el sistema"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez García"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>WhatsApp / Teléfono</Label>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Este número se usará para el grupo de difusión del torneo y su RPM-ID
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                +52
              </span>
              <Input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="55 0000 0000"
                className="pl-11"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Género</Label>
              <div className="flex rounded-lg border border-input p-1 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setSex("M")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    sex === "M" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Varonil
                </button>
                <button
                  type="button"
                  onClick={() => setSex("F")}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    sex === "F" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Femenil
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría según ranking local</Label>
              <Select value={category || "__none__"} onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Seleccionar...</SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {["1ra", "2da", "3ra", "4ta", "5ta", "6ta"].includes(opt) ? `${opt} Fuerza` : getCategoryLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@ejemplo.com"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={sendWhatsAppInvite}
              onCheckedChange={(v) => setSendWhatsAppInvite(v === true)}
            />
            <span className="text-sm font-medium group-hover:text-foreground/80 transition-colors">
              Enviar invitación de registro por WhatsApp ahora
            </span>
          </label>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-4 flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              Al guardar, se creará un perfil base y se le asignará un ID provisional. Podrás enviarle una invitación para completar su perfil más tarde si lo deseas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar y Seleccionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

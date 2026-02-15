"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge"
import { useRegisterTeam } from "@/hooks/use-tournaments"
import { Search, User, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegisterTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
  modalities: Array<{
    id: string
    modality: string
    category: string
    registeredTeams: number
  }>
}

export function RegisterTeamModal({
  open,
  onOpenChange,
  tournamentId,
  modalities,
}: RegisterTeamModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [selectedModality, setSelectedModality] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [playerId, setPlayerId] = useState<string | null>(null)

  const registerMutation = useRegisterTeam()

  // Get current user's playerId
  useEffect(() => {
    const fetchPlayerId = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/players?userId=${session.user.id}`)
          const data = await response.json()
          if (data.success && data.data.data && data.data.data.length > 0) {
            setPlayerId(data.data.data[0].id)
          }
        } catch (error) {
          console.error("Error fetching playerId:", error)
        }
      }
    }
    fetchPlayerId()
  }, [session?.user?.id])

  // Search for partners
  useEffect(() => {
    const searchPartners = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/players/search?name=${encodeURIComponent(searchTerm)}`
        )
        const data = await response.json()
        if (data.success) {
          // Filter out current user
          const results = data.data.filter((p: any) => p.id !== playerId)
          setSearchResults(results)
        }
      } catch (error) {
        console.error("Error searching partners:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchPartners, 300)
    return () => clearTimeout(debounce)
  }, [searchTerm, playerId])

  const handleRegister = async () => {
    if (!selectedModality || !selectedPartner || !playerId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una modalidad y un compañero",
        variant: "destructive",
      })
      return
    }

    try {
      await registerMutation.mutateAsync({
        tournamentId,
        data: {
          tournamentModalityId: selectedModality,
          player1Id: playerId,
          player2Id: selectedPartner.id,
        },
      })

      toast({
        title: "¡Inscripción exitosa!",
        description: "Te has inscrito al torneo correctamente",
      })

      onOpenChange(false)
      
      // Reset form
      setSelectedModality("")
      setSelectedPartner(null)
      setSearchTerm("")
    } catch (error: any) {
      toast({
        title: "Error al inscribirse",
        description: error.message || "Hubo un error al procesar tu inscripción",
        variant: "destructive",
      })
    }
  }

  const selectedModalityData = modalities.find((m) => m.id === selectedModality)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inscribirse al Torneo</DialogTitle>
          <DialogDescription>
            Selecciona la modalidad y tu compañero de pareja
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Modality selection */}
          <div className="space-y-2">
            <Label htmlFor="modality">Modalidad</Label>
            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger id="modality">
                <SelectValue placeholder="Selecciona una modalidad" />
              </SelectTrigger>
              <SelectContent>
                {modalities.map((modality) => (
                  <SelectItem key={modality.id} value={modality.id}>
                    {modality.category} {modality.modality} ({modality.registeredTeams} equipos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModalityData && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">
                Categoría: <span className="font-medium text-foreground">{selectedModalityData.category}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Modalidad: <span className="font-medium text-foreground">{selectedModalityData.modality}</span>
              </p>
            </div>
          )}

          {/* Partner search */}
          <div className="space-y-2">
            <Label htmlFor="partner">Buscar Compañero</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="partner"
                placeholder="Nombre del compañero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Selected partner */}
            {selectedPartner && (
              <div className="flex items-center justify-between rounded-lg border border-primary/50 bg-primary/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedPartner.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedPartner.city}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPartner(null)
                    setSearchTerm("")
                  }}
                >
                  Cambiar
                </Button>
              </div>
            )}

            {/* Search results */}
            {!selectedPartner && searchResults.length > 0 && (
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-2">
                {searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPartner(player)
                      setSearchTerm("")
                      setSearchResults([])
                    }}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{player.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.city} • {player.sex === "MALE" ? "Masculino" : "Femenino"}
                      </p>
                    </div>
                    {player.rankings && player.rankings.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {player.rankings[0].points} pts
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!selectedPartner && searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No se encontraron jugadores</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleRegister}
            disabled={!selectedModality || !selectedPartner || registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscribiendo...
              </>
            ) : (
              "Inscribirse"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

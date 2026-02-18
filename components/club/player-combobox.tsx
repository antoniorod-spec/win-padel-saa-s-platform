"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, ChevronsUpDown, User, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchPlayerByPhone } from "@/lib/api/players"

type PlayerOption = { id: string; firstName: string; lastName: string; fullName: string }

interface PlayerComboboxProps {
  value: PlayerOption | null
  onSelect: (player: PlayerOption | null) => void
  onCreateNew?: (searchText: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** ID del jugador a excluir (ej. el ya seleccionado en el otro slot) */
  excludePlayerId?: string
}

export function PlayerCombobox({
  value,
  onSelect,
  onCreateNew,
  placeholder = "Buscar por nombre o teléfono...",
  disabled,
  className,
  excludePlayerId,
}: PlayerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<PlayerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const searchPlayers = useCallback(async (term: string) => {
    setLoading(true)
    try {
      const trimmed = term.trim()
      const cleaned = term.replace(/\D/g, "").trim()
      const isPhone = trimmed.length > 0 && cleaned.length >= 10

      if (isPhone) {
        const res = await fetchPlayerByPhone(cleaned)
        if (res?.success && res?.data) {
          const p = res.data as { id: string; firstName: string; lastName: string }
          setResults([{ ...p, fullName: `${p.firstName} ${p.lastName}` }])
          setShowCreate(false)
        } else {
          setResults([])
          setShowCreate(true)
        }
      } else {
        const r = await fetch(`/api/players/search?name=${encodeURIComponent(trimmed)}`)
        const data = await r.json()
        if (data?.success && Array.isArray(data.data)) {
          const opts: PlayerOption[] = data.data.map((p: any) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            fullName: p.fullName || `${p.firstName} ${p.lastName}`,
          }))
          setResults(opts)
          setShowCreate(opts.length === 0 && trimmed.length >= 2)
        } else {
          setResults([])
          setShowCreate(trimmed.length >= 2)
        }
      }
    } catch {
      setResults([])
      setShowCreate(term.trim().length >= 2)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const delay = search.trim() ? 300 : 0
    const t = setTimeout(() => searchPlayers(search), delay)
    return () => clearTimeout(t)
  }, [open, search, searchPlayers])

  const handleSelect = (player: PlayerOption) => {
    onSelect(player)
    setOpen(false)
    setSearch("")
  }

  const handleCreateNew = () => {
    if (onCreateNew && search.trim()) {
      onCreateNew(search.trim())
      setOpen(false)
      setSearch("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-9 justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {value ? value.fullName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nombre o teléfono..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : showCreate ? null : "Sin resultados"}
            </CommandEmpty>
            {showCreate && search.trim() && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateNew}
                  className="bg-primary/5 text-primary font-semibold"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  + Crear nuevo jugador: {search}
                </CommandItem>
              </CommandGroup>
            )}
            {results.filter((p) => !excludePlayerId || p.id !== excludePlayerId).length > 0 && (
              <CommandGroup>
                {results
                  .filter((p) => !excludePlayerId || p.id !== excludePlayerId)
                  .map((p) => (
                    <CommandItem key={p.id} value={p.id} onSelect={() => handleSelect(p)}>
                      <Check className={cn("mr-2 h-4 w-4", value?.id === p.id ? "opacity-100" : "opacity-0")} />
                      {p.fullName}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

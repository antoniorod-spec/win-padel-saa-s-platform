"use client"

import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"

const libraries: ("places")[] = ["places"]

export type ClubPlacePayload = {
  placeId: string
  place: {
    name?: string
    formatted_address?: string
    url?: string
    website?: string
    formatted_phone_number?: string
    international_phone_number?: string
    address_components?: google.maps.GeocoderAddressComponent[]
    geometry?: { location?: { lat?: number; lng?: number } }
  }
}

type Props = {
  label?: string
  placeholder?: string
  value?: string
  disabled?: boolean
  onSelect: (payload: ClubPlacePayload) => void | Promise<void>
  onClear?: () => void
  helperText?: string
}

export function ClubPlacesPicker({
  label,
  placeholder = "Buscar club en Google...",
  value,
  disabled,
  onSelect,
  onClear,
  helperText,
}: Props) {
  const t = useTranslations("ClubPlaces")
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value ?? "")

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  // Keep input in sync with the selected value from parent.
  useEffect(() => {
    setInputValue(value ?? "")
  }, [value])

  const onLoad = (instance: google.maps.places.Autocomplete) => setAutocomplete(instance)

  const onPlaceChanged = async () => {
    if (!autocomplete) return
    const place = autocomplete.getPlace()
    const placeId = place.place_id ? String(place.place_id) : ""
    if (!placeId) return

    const display = (place.name || place.formatted_address || "").trim()
    if (display) setInputValue(display)

    const lat = place.geometry?.location?.lat?.()
    const lng = place.geometry?.location?.lng?.()

    await onSelect({
      placeId,
      place: {
        name: place.name ?? undefined,
        formatted_address: place.formatted_address ?? undefined,
        url: (place as any).url ?? undefined,
        website: place.website ?? undefined,
        formatted_phone_number: place.formatted_phone_number ?? undefined,
        international_phone_number: (place as any).international_phone_number ?? undefined,
        address_components: place.address_components ?? undefined,
        geometry: {
          location: {
            lat: typeof lat === "number" ? lat : undefined,
            lng: typeof lng === "number" ? lng : undefined,
          },
        },
      },
    })
  }

  const canUseGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  if (!canUseGoogle || loadError) {
    return (
      <div className="flex flex-col gap-2">
        {label ? <Label>{label}</Label> : null}
        <Input disabled value={value ?? ""} placeholder={t("missingKey")} />
        {helperText ? <span className="text-xs text-muted-foreground">{helperText}</span> : null}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-2">
        {label ? <Label>{label}</Label> : null}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("loading")}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? <Label>{label}</Label> : null}
      <div className="flex gap-2">
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ["establishment"],
            componentRestrictions: { country: ["mx", "es", "ar"] },
          }}
        >
          <Input
            ref={inputRef}
            disabled={disabled}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </Autocomplete>
        {onClear ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              setInputValue("")
              onClear()
            }}
            aria-label={t("clearAria")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {helperText ? <span className="text-xs text-muted-foreground">{helperText}</span> : null}
    </div>
  )
}


"use client"

import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useState, useRef } from "react"

const libraries: ("places")[] = ["places"]

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void
  onCoordinatesChange?: (lat: number, lng: number) => void
  required?: boolean
  placeholder?: string
  label?: string
  helperText?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  onCoordinatesChange,
  required = false,
  placeholder = "Buscar dirección o negocio...",
  label = "Dirección",
  helperText,
}: AddressAutocompleteProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        onChange(place.formatted_address)
      }
      
      // Extraer coordenadas si existen
      if (place.geometry?.location && onCoordinatesChange) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        onCoordinatesChange(lat, lng)
      }
      
      // Llamar callback adicional si existe (para extraer más datos)
      if (onPlaceSelected) {
        onPlaceSelected(place)
      }
    }
  }

  // Si no hay API key, mostrar input normal
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col gap-2">
        {label && <Label htmlFor="address">{label}</Label>}
        <Input
          id="address"
          placeholder={placeholder}
          className="bg-background"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={10}
        />
        {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-2">
        {label && <Label htmlFor="address">{label}</Label>}
        <Input
          id="address"
          placeholder={placeholder}
          className="bg-background"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={10}
        />
        {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
        <span className="text-xs text-yellow-600">Google Maps no disponible. Ingresa la dirección manualmente.</span>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando mapa...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <Label htmlFor="address">{label}</Label>}
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
          types: ["establishment", "address"], // Buscar negocios Y direcciones
          componentRestrictions: { country: ["mx", "es", "ar"] }, // México, España, Argentina
        }}
      >
        <Input
          ref={inputRef}
          id="address"
          type="text"
          placeholder={placeholder}
          className="bg-background"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={10}
        />
      </Autocomplete>
      {helperText && <span className="text-xs text-muted-foreground">{helperText}</span>}
    </div>
  )
}

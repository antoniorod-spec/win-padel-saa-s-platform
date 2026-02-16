import { normalizeLocationToken } from "./keys"

type CountryCode = string

// Minimal alias set; we can expand as we see real data.
// Values must be normalized tokens (hyphenated, lowercase, no accents).
const MX_STATE_ALIASES: Record<string, string> = {
  slp: "san-luis-potosi",
  "san-luis": "san-luis-potosi",
  cdmx: "ciudad-de-mexico",
  df: "ciudad-de-mexico",
  "mexico-df": "ciudad-de-mexico",
  nl: "nuevo-leon",
}

const MX_CITY_ALIASES_BY_STATE: Record<string, Record<string, string>> = {
  "san-luis-potosi": {
    slp: "san-luis-potosi",
    "san-luis": "san-luis-potosi",
    "san-luis-potosi": "san-luis-potosi",
  },
  "ciudad-de-mexico": {
    cdmx: "ciudad-de-mexico",
    df: "ciudad-de-mexico",
    "mexico-df": "ciudad-de-mexico",
    "ciudad-de-mexico": "ciudad-de-mexico",
  },
}

export function canonicalStateToken(country: CountryCode, stateLabel: string): string {
  const c = (country || "xx").toLowerCase().trim()
  const token = normalizeLocationToken(stateLabel)
  if (c === "mx") return MX_STATE_ALIASES[token] ?? token
  return token
}

export function canonicalCityToken(
  country: CountryCode,
  canonicalStateTokenValue: string,
  cityLabel: string
): string {
  const c = (country || "xx").toLowerCase().trim()
  const token = normalizeLocationToken(cityLabel)
  if (c === "mx") {
    const stateMap = MX_CITY_ALIASES_BY_STATE[canonicalStateTokenValue]
    if (stateMap) return stateMap[token] ?? token
  }
  return token
}


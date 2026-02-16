import { canonicalCityToken, canonicalStateToken } from "./aliases"

export function normalizeLocationToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "") // keep it stable and URL-safe-ish
    .trim()
    .replace(/\s+/g, "-")
}

export function buildStateKey(country: string, stateLabel: string): string {
  const c = (country || "xx").toLowerCase().trim()
  return `${c}:${canonicalStateToken(c, stateLabel)}`
}

export function buildCityKey(country: string, stateLabel: string, cityLabel: string): string {
  const c = (country || "xx").toLowerCase().trim()
  const stateToken = canonicalStateToken(c, stateLabel)
  return `${c}:${stateToken}:${canonicalCityToken(c, stateToken, cityLabel)}`
}

export function pickBestLabel(labels: string[]): string {
  if (labels.length === 0) return ""
  // Prefer a label that already contains diacritics/case (often "more correct" in Spanish),
  // otherwise prefer the longest trimmed one.
  const trimmed = labels.map((l) => l.trim()).filter(Boolean)
  const withDiacritics = trimmed.filter((l) => /[\u00C0-\u017F]/.test(l))
  const candidates = withDiacritics.length > 0 ? withDiacritics : trimmed
  return candidates.sort((a, b) => b.length - a.length)[0] || trimmed[0] || labels[0]
}


import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Sanitiza labels del backend para mostrar en UI: capitaliza, quita guiones bajos, unifica formato */
export function sanitizeLabel(raw: string): string {
  if (!raw?.trim()) return ""
  const s = raw.trim()
  return s
    .split(/[\s_]+/)
    .map((word) => {
      const lower = word.toLowerCase()
      if (lower === "1ra" || lower === "2da" || lower === "3ra" || lower === "4ta" || lower === "5ta" || lower === "6ta") return word
      return word.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(" ")
}

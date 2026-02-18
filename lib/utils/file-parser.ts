import * as XLSX from "xlsx"

function toText(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export async function parseSpreadsheet(file: File): Promise<Array<Record<string, string>>> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  })

  return rows.map((row) => {
    const normalized: Record<string, string> = {}
    for (const [rawKey, rawValue] of Object.entries(row)) {
      normalized[normalizeHeader(rawKey)] = toText(rawValue)
    }
    return normalized
  })
}

export function normalizeFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

/**
 * Normaliza teléfono: solo dígitos.
 * Para México (MX): si viene con +52 o 52, se normaliza a 10 dígitos para consistencia.
 * Ej: "+52 811 123 4567", "811 123 4567", "528111234567" → "8111234567"
 * Maneja: "4445200880. +52" → "4445200880", "444520088052" → "4445200880"
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D+/g, "")
  if (digits.length === 0) return null
  // MX: 12 dígitos empezando con 52 → usar últimos 10
  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.slice(2)
  }
  // MX: 12 dígitos terminando en 52 (ej: "444520088052" por "4445200880" + "52" concatenado)
  if (digits.length === 12 && digits.endsWith("52")) {
    return digits.slice(0, 10)
  }
  return digits
}

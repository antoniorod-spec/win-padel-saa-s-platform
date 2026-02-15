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

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D+/g, "")
  return digits.length > 0 ? digits : null
}

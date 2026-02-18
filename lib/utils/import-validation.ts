/**
 * Lógica compartida para validación de importación de parejas.
 * Usado por el API de validate y por el cliente.
 */

function pick(row: Record<string, string>, keys: readonly string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ""
}

function parseFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 0) return { firstName: "", lastName: "" }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

const CATEGORY_ALIASES: Record<string, string> = {
  "1": "1ra", "1ra": "1ra", "primera": "1ra", "primero": "1ra",
  "2": "2da", "2da": "2da", "segunda": "2da", "segundo": "2da", "2da fuerza": "2da",
  "3": "3ra", "3ra": "3ra", "tercera": "3ra", "tercero": "3ra", "3ra fuerza": "3ra",
  "4": "4ta", "4ta": "4ta", "cuarta": "4ta", "cuarto": "4ta", "4ta fuerza": "4ta", "cuarta fuerza": "4ta",
  "5": "5ta", "5ta": "5ta", "quinta": "5ta", "quinto": "5ta",
  "6": "6ta", "6ta": "6ta", "sexta": "6ta", "sexto": "6ta",
  "a": "A", "b": "B", "c": "C", "d": "D",
  "10u": "10U", "10 y menores": "10U", "sub 10": "10U",
  "12u": "12U", "12 y menores": "12U", "sub 12": "12U",
  "14u": "14U", "14 y menores": "14U", "sub 14": "14U", "juvenil 14": "14U",
  "16u": "16U", "16 y menores": "16U", "sub 16": "16U", "juvenil 16": "16U",
  "18u": "18U", "18 y menores": "18U", "sub 18": "18U", "juvenil 18": "18U",
  "senior": "Senior", "veteranos": "Senior",
  "open": "Open", "abierto": "Open",
}

const MODALITY_ALIASES: Record<string, string> = {
  "varonil": "VARONIL", "masculino": "VARONIL", "m": "VARONIL", "hombres": "VARONIL",
  "femenil": "FEMENIL", "femenino": "FEMENIL", "f": "FEMENIL", "mujeres": "FEMENIL",
  "mixto": "MIXTO", "mixed": "MIXTO",
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}

export function matchModalityByCategory(
  modalities: Array<{ id: string; modality: string; category: string }>,
  categoryStr: string
): { id: string } | null {
  const input = normalizeForMatch(categoryStr)
  if (!input) return null

  for (const m of modalities) {
    const modNorm = m.modality.toUpperCase()
    const catNorm = m.category

    let modKeys = Object.entries(MODALITY_ALIASES)
      .filter(([, v]) => v === modNorm)
      .map(([k]) => k)
    if (modKeys.length === 0) modKeys = [modNorm.toLowerCase()]

    let catKeys = Object.entries(CATEGORY_ALIASES)
      .filter(([, v]) => v === catNorm)
      .map(([k]) => k)
    if (catKeys.length === 0) catKeys = [catNorm.toLowerCase()]

    const variants: string[] = []
    for (const ck of catKeys) {
      for (const mk of modKeys) {
        variants.push(`${ck} ${mk}`.trim(), `${mk} ${ck}`.trim())
      }
      variants.push(ck)
    }

    const matches = variants.some(
      (v) =>
        input === v ||
        input.includes(v) ||
        v.includes(input) ||
        input.replace(/\s/g, "") === v.replace(/\s/g, "")
    )
    if (matches) return { id: m.id }
  }
  return null
}

export const PICK_KEYS = {
  p1Phone: ["telefono_jugador_1", "player1_phone", "telefono1", "celular1", "telefono_j1", "player1_telefono", "jugador1_telefono"],
  p2Phone: ["telefono_jugador_2", "player2_phone", "telefono2", "celular2", "telefono_j2", "player2_telefono", "jugador2_telefono"],
  p1Name: ["nombre_jugador_1", "player1_first_name", "nombre1", "player1_name", "nombre_j1", "nombre_jugador_1", "player1_nombre"],
  p1Last: ["apellido_jugador_1", "player1_last_name", "apellido1", "player1_lastname", "apellido_j1", "apellido_jugador_1"],
  p2Name: ["nombre_jugador_2", "player2_first_name", "nombre2", "player2_name", "nombre_j2", "nombre_jugador_2", "player2_nombre"],
  p2Last: ["apellido_jugador_2", "player2_last_name", "apellido2", "player2_lastname", "apellido_j2", "apellido_jugador_2"],
  category: ["categoria", "category", "modalidad"],
} as const

export function parsePairRow(row: Record<string, string>): {
  p1Phone: string
  p2Phone: string
  p1First: string
  p1Last: string
  p2First: string
  p2Last: string
  category: string
} | null {
  const p1Phone = pick(row, PICK_KEYS.p1Phone)
  const p2Phone = pick(row, PICK_KEYS.p2Phone)
  if (!p1Phone || !p2Phone) return null

  const p1NameCol = pick(row, PICK_KEYS.p1Name)
  const p1LastCol = pick(row, PICK_KEYS.p1Last)
  const p2NameCol = pick(row, PICK_KEYS.p2Name)
  const p2LastCol = pick(row, PICK_KEYS.p2Last)

  let p1First: string
  let p1Last: string
  let p2First: string
  let p2Last: string

  if (p1NameCol && p1LastCol) {
    p1First = p1NameCol
    p1Last = p1LastCol
  } else if (p1NameCol) {
    const parsed = parseFullName(p1NameCol)
    p1First = parsed.firstName
    p1Last = parsed.lastName || parsed.firstName
  } else {
    return null
  }

  if (p2NameCol && p2LastCol) {
    p2First = p2NameCol
    p2Last = p2LastCol
  } else if (p2NameCol) {
    const parsed = parseFullName(p2NameCol)
    p2First = parsed.firstName
    p2Last = parsed.lastName || parsed.firstName
  } else {
    return null
  }

  const category = pick(row, PICK_KEYS.category)

  return {
    p1Phone,
    p2Phone,
    p1First,
    p1Last,
    p2First,
    p2Last,
    category,
  }
}

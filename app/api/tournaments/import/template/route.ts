import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

const HEADERS = [
  "Nombre Jugador 1",
  "Apellido Jugador 1",
  "Teléfono Jugador 1",
  "Nombre Jugador 2",
  "Apellido Jugador 2",
  "Teléfono Jugador 2",
  "Categoría",
  "País",
]

// Ejemplos de todas las categorías varonil y femenil. Teléfono sin +52 si país es MX.
const SAMPLE_ROWS = [
  ["Juan", "Pérez García", "811 123 4567", "Carlos", "Ruíz López", "811 987 6543", "2da Varonil", "MX"],
  ["María", "González López", "55 1234 5678", "Ana", "Martínez Sánchez", "55 8765 4321", "2da Femenil", "MX"],
  ["Pedro", "Hernández Díaz", "33 111 2222", "Luis", "Torres Flores", "33 333 4444", "3ra Varonil", "MX"],
  ["Laura", "Ramírez Cruz", "81 555 6666", "Sofía", "Ortiz Vega", "81 777 8888", "3ra Femenil", "MX"],
  ["Roberto", "Morales Reyes", "664 111 2233", "Miguel", "Jiménez Ruiz", "664 445 5667", "4ta Varonil", "MX"],
  ["Valeria", "Castillo Luna", "222 111 2233", "Diana", "Rojas Méndez", "222 334 4556", "4ta Femenil", "MX"],
  ["Fernando", "Gutiérrez Soto", "444 555 6677", "Andrés", "Vargas Castro", "444 778 8990", "Open Varonil", "MX"],
  ["Carmen", "Silva Navarro", "618 123 4567", "Patricia", "Mendoza Acosta", "618 789 0123", "Open Femenil", "MX"],
]

export async function GET() {
  const wb = XLSX.utils.book_new()
  const wsData = [HEADERS, ...SAMPLE_ROWS]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, ws, "Parejas")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-inscripcion-parejas.xlsx"',
    },
  })
}

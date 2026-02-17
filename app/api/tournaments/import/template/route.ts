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
]

const SAMPLE_ROW = [
  "Juan",
  "Pérez García",
  "+52 811 123 4567",
  "Carlos",
  "Ruíz López",
  "+52 811 987 6543",
  "Varonil 2da",
]

export async function GET() {
  const wb = XLSX.utils.book_new()
  const wsData = [HEADERS, SAMPLE_ROW]
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

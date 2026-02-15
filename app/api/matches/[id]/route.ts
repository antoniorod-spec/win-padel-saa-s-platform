import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournamentModality: {
          include: { tournament: { select: { name: true, category: true, clubId: true } } },
        },
        teamARegistration: {
          include: {
            player1: { select: { id: true, firstName: true, lastName: true } },
            player2: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        teamBRegistration: {
          include: {
            player1: { select: { id: true, firstName: true, lastName: true } },
            player2: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Partido no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: match })
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener partido" },
      { status: 500 }
    )
  }
}

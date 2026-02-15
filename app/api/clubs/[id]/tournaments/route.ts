import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { clubId: id }
    if (status) where.status = status

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        modalities: {
          include: {
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        category: t.category,
        format: t.format,
        prize: t.prize,
        maxTeams: t.maxTeams,
        status: t.status,
        modalities: t.modalities.map((m) => ({
          modality: m.modality,
          category: m.category,
          registeredTeams: m._count.registrations,
        })),
        totalRegisteredTeams: t.modalities.reduce(
          (sum, m) => sum + m._count.registrations, 0
        ),
      })),
    })
  } catch (error) {
    console.error("Error fetching club tournaments:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener torneos del club" },
      { status: 500 }
    )
  }
}

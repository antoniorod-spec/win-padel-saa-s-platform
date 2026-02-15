import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const status = searchParams.get("status") ?? "APPROVED"
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { status }
    if (city) where.city = { equals: city, mode: "insensitive" }
    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const clubs = await prisma.club.findMany({
      where,
      include: {
        _count: {
          select: { tournaments: true },
        },
      },
      orderBy: { rating: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: clubs.map((club) => ({
        id: club.id,
        name: club.name,
        city: club.city,
        country: club.country,
        courts: club.courts,
        rating: club.rating,
        description: club.description,
        phone: club.phone,
        logoUrl: club.logoUrl,
        tournaments: club._count.tournaments,
        status: club.status,
      })),
    })
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener clubes" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const modality = searchParams.get("modality")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") ?? "1")
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20")

    const where: Record<string, unknown> = {}

    if (city) where.city = city
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ]
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
          rankings: modality && category ? {
            where: {
              modality: modality as "VARONIL" | "FEMENIL" | "MIXTO",
              category,
            },
          } : true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.player.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: players.map((p) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: `${p.firstName} ${p.lastName}`,
          city: p.city,
          country: p.country,
          sex: p.sex,
          avatarUrl: p.user.image,
          rankings: p.rankings,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener jugadores" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const pendingClubs = await prisma.club.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { email: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: pendingClubs.map((club) => ({
        id: club.id,
        name: club.name,
        city: club.city,
        courts: club.courts,
        email: club.user.email,
        requestDate: club.createdAt,
        status: club.status,
      })),
    })
  } catch (error) {
    console.error("Error fetching pending clubs:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener clubes pendientes" },
      { status: 500 }
    )
  }
}

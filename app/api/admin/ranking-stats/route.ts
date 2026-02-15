import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const rankings = await prisma.ranking.groupBy({
      by: ["modality", "category"],
      _count: { id: true },
      _avg: { points: true },
    })

    return NextResponse.json({
      success: true,
      data: rankings.map((r) => ({
        modality: r.modality,
        category: r.category,
        count: r._count.id,
        avgPoints: Math.round(r._avg.points ?? 0),
      })),
    })
  } catch (error) {
    console.error("Error fetching ranking stats:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener estadisticas de ranking" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") ?? "PENDING"

    const reviews = await prisma.categoryChange.findMany({
      where: { status: status as "PENDING" | "APPROVED" | "REJECTED" },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        player: `${r.player.firstName} ${r.player.lastName}`,
        playerId: r.player.id,
        modality: r.modality,
        fromCategory: r.fromCategory,
        toCategory: r.toCategory,
        type: r.type,
        status: r.status,
        reason: r.reason,
        autoApproved: r.autoApproved,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching category reviews:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener revisiones" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { applyCategoryChange } from "@/lib/services/category-service"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["ADMIN"])
    if (error) return error

    const body = await request.json()
    const { action } = body // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Accion invalida" },
        { status: 400 }
      )
    }

    const review = await prisma.categoryChange.findUnique({ where: { id } })
    if (!review) {
      return NextResponse.json(
        { success: false, error: "Revision no encontrada" },
        { status: 404 }
      )
    }

    if (review.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Esta revision ya fue procesada" },
        { status: 400 }
      )
    }

    if (action === "approve") {
      await applyCategoryChange(id)
    }

    await prisma.categoryChange.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedBy: session!.user.id,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Cambio de categoria ${action === "approve" ? "aprobado" : "rechazado"}`,
    })
  } catch (error) {
    console.error("Error processing category review:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar revision" },
      { status: 500 }
    )
  }
}

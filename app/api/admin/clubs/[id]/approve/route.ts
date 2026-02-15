import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const body = await request.json()
    const { action } = body // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Accion invalida. Use 'approve' o 'reject'" },
        { status: 400 }
      )
    }

    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const updated = await prisma.club.update({
      where: { id },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Club ${action === "approve" ? "aprobado" : "rechazado"} exitosamente`,
    })
  } catch (error) {
    console.error("Error approving/rejecting club:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar solicitud" },
      { status: 500 }
    )
  }
}

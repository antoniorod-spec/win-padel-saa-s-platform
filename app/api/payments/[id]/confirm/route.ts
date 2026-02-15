import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const { action, reference } = body // "confirm" or "reject"

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Accion invalida" },
        { status: 400 }
      )
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id },
      include: {
        tournamentModality: {
          include: { tournament: { include: { club: true } } },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    // Verify club ownership
    if (
      registration.tournamentModality.tournament.club.userId !== session!.user.id &&
      session!.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      )
    }

    const updated = await prisma.tournamentRegistration.update({
      where: { id },
      data: {
        paymentStatus: action === "confirm" ? "CONFIRMED" : "REJECTED",
        paymentReference: reference ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Pago ${action === "confirm" ? "confirmado" : "rechazado"}`,
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar pago" },
      { status: 500 }
    )
  }
}

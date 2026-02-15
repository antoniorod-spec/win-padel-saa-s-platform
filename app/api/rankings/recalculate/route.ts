import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { recalculateAllRankings } from "@/lib/services/ranking-service"

export async function POST() {
  try {
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    await recalculateAllRankings()

    return NextResponse.json({
      success: true,
      message: "Rankings recalculados exitosamente",
    })
  } catch (error) {
    console.error("Error recalculating rankings:", error)
    return NextResponse.json(
      { success: false, error: "Error al recalcular rankings" },
      { status: 500 }
    )
  }
}

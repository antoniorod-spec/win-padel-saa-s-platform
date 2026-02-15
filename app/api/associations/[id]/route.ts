import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const association = await prisma.association.findUnique({
      where: { id },
      include: {
        validatedSubmissions: {
          orderBy: { updatedAt: "desc" },
          take: 20,
        },
      },
    })
    if (!association) {
      return NextResponse.json({ success: false, error: "Asociacion no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: association })
  } catch (err) {
    console.error("Error fetching association:", err)
    return NextResponse.json({ success: false, error: "Error al obtener asociacion" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const body = await request.json()
    const updated = await prisma.association.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name : undefined,
        city: typeof body.city === "string" ? body.city : undefined,
        state: typeof body.state === "string" ? body.state : undefined,
        country: typeof body.country === "string" ? body.country : undefined,
        status: typeof body.status === "string" ? body.status : undefined,
      },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error("Error updating association:", err)
    return NextResponse.json({ success: false, error: "Error al actualizar asociacion" }, { status: 500 })
  }
}

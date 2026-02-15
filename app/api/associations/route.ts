import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (city) where.city = city
    if (status) where.status = status

    const data = await prisma.association.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("Error fetching associations:", err)
    return NextResponse.json({ success: false, error: "Error al obtener asociaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["ADMIN"])
    if (error) return error
    const body = await request.json()
    if (!body?.name || !body?.city) {
      return NextResponse.json({ success: false, error: "Nombre y ciudad son requeridos" }, { status: 400 })
    }

    const created = await prisma.association.create({
      data: {
        name: String(body.name),
        city: String(body.city),
        state: typeof body.state === "string" ? body.state : undefined,
        country: typeof body.country === "string" ? body.country : "MX",
        status: typeof body.status === "string" ? body.status : "ACTIVE",
        ownerUserId: session!.user.id,
      },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (err) {
    console.error("Error creating association:", err)
    return NextResponse.json({ success: false, error: "Error al crear asociacion" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

const createClubNewsSchema = z.object({
  title: z.string().min(3, "Titulo requerido"),
  content: z.string().min(10, "Contenido requerido"),
  coverImageUrl: z.string().url("URL de portada invalida").or(z.literal("")).optional(),
  published: z.boolean().optional(),
})

export async function GET() {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const items = await prisma.clubNews.findMany({
      where: { clubId: club.id },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error("Error fetching club news:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener novedades del club" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = createClubNewsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const coverImageUrl =
      parsed.data.coverImageUrl && parsed.data.coverImageUrl.trim() !== ""
        ? parsed.data.coverImageUrl.trim()
        : null
    const published = !!parsed.data.published

    const created = await prisma.clubNews.create({
      data: {
        clubId: club.id,
        title: parsed.data.title.trim(),
        content: parsed.data.content.trim(),
        coverImageUrl,
        published,
        publishedAt: published ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error("Error creating club news:", error)
    return NextResponse.json(
      { success: false, error: "Error al crear novedad" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

const updateClubNewsSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  coverImageUrl: z.string().url().or(z.literal("")).optional(),
  published: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error
    const { newsId } = await params

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const existing = await prisma.clubNews.findUnique({ where: { id: newsId } })
    if (!existing || existing.clubId !== club.id) {
      return NextResponse.json(
        { success: false, error: "Novedad no encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = updateClubNewsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (typeof parsed.data.title === "string") data.title = parsed.data.title.trim()
    if (typeof parsed.data.content === "string") data.content = parsed.data.content.trim()
    if ("coverImageUrl" in parsed.data) {
      data.coverImageUrl =
        parsed.data.coverImageUrl && parsed.data.coverImageUrl.trim() !== ""
          ? parsed.data.coverImageUrl.trim()
          : null
    }
    if (typeof parsed.data.published === "boolean") {
      data.published = parsed.data.published
      data.publishedAt = parsed.data.published ? existing.publishedAt ?? new Date() : null
    }

    const updated = await prisma.clubNews.update({
      where: { id: newsId },
      data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Error updating club news:", error)
    return NextResponse.json(
      { success: false, error: "Error al actualizar novedad" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ newsId: string }> }
) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error
    const { newsId } = await params

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
    })
    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const existing = await prisma.clubNews.findUnique({ where: { id: newsId } })
    if (!existing || existing.clubId !== club.id) {
      return NextResponse.json(
        { success: false, error: "Novedad no encontrada" },
        { status: 404 }
      )
    }

    await prisma.clubNews.delete({ where: { id: newsId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting club news:", error)
    return NextResponse.json(
      { success: false, error: "Error al eliminar novedad" },
      { status: 500 }
    )
  }
}

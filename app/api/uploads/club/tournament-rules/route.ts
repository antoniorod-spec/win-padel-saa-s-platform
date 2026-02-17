import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdminClient } from "@/lib/supabase"

const ALLOWED_MIME = "application/pdf"
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    })

    if (!club) {
      return NextResponse.json(
        { success: false, error: "Club no encontrado" },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Archivo PDF requerido" },
        { status: 400 }
      )
    }

    if (file.type !== ALLOWED_MIME) {
      return NextResponse.json(
        { success: false, error: "Solo se permiten archivos PDF" },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "El archivo excede 10MB" },
        { status: 400 }
      )
    }

    const path = `clubs/${club.id}/tournament-rules/rules-${Date.now()}.pdf`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = getSupabaseAdminClient()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET_CLUBS || "club-media"
    const uploadResult = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadResult.error) throw uploadResult.error

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

    return NextResponse.json({
      success: true,
      data: {
        path,
        publicUrl,
      },
    })
  } catch (error) {
    console.error("Error uploading tournament rules PDF:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir reglamento" },
      { status: 500 }
    )
  }
}

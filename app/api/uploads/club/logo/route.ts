import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdminClient } from "@/lib/supabase"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["PLAYER", "CLUB", "ADMIN"])
    if (error) return error

    const club = await prisma.club.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    })

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Archivo requerido" },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Formato no permitido. Usa JPG, PNG o WEBP" },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "El archivo excede 5MB" },
        { status: 400 }
      )
    }

    const ext = extFromMime(file.type)
    const ownerKey = club?.id ?? `user-${session!.user.id}`
    const path = `clubs/${ownerKey}/logo-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = getSupabaseAdminClient()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET_CLUBS || "club-media"
    const uploadResult = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadResult.error) {
      throw uploadResult.error
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

    return NextResponse.json({
      success: true,
      data: {
        path,
        publicUrl,
      },
    })
  } catch (error) {
    console.error("Error uploading club logo:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir logo" },
      { status: 500 }
    )
  }
}

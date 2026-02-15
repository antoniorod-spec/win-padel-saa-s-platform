import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdminClient } from "@/lib/supabase"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_SIZE_BYTES = 8 * 1024 * 1024

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
    const files = formData.getAll("files").filter((item): item is File => item instanceof File)
    if (files.length === 0) {
      const single = formData.get("file")
      if (single instanceof File) files.push(single)
    }
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Archivos requeridos" },
        { status: 400 }
      )
    }
    if (files.length > 8) {
      return NextResponse.json(
        { success: false, error: "Maximo 8 imagenes por carga" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET_CLUBS || "club-media"
    const uploaded: Array<{ path: string; publicUrl: string }> = []

    const ownerKey = club?.id ?? `user-${session!.user.id}`
    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { success: false, error: "Formato no permitido. Usa JPG, PNG o WEBP" },
          { status: 400 }
        )
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: "Una imagen excede 8MB" },
          { status: 400 }
        )
      }

      const ext = extFromMime(file.type)
      const path = `clubs/${ownerKey}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploadResult = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadResult.error) throw uploadResult.error
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      uploaded.push({ path, publicUrl })
    }

    return NextResponse.json({ success: true, data: uploaded })
  } catch (error) {
    console.error("Error uploading club gallery images:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir imagenes" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { getSupabaseAdminClient } from "@/lib/supabase"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

function hasSupabaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  )
}

/** Fallback: guarda en public/uploads cuando Supabase no está configurado (desarrollo local) */
async function uploadToLocal(
  clubId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "club-posters", clubId)
  await mkdir(uploadDir, { recursive: true })
  const filename = `poster-${Date.now()}.${ext}`
  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, buffer)
  return `/uploads/club-posters/${clubId}/${filename}`
}

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
        {
          success: false,
          error:
            "Club no encontrado. Completa el onboarding del club antes de subir el cartel.",
        },
        { status: 404 }
      )
    }

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
    const buffer = Buffer.from(await file.arrayBuffer())

    let publicUrl: string

    if (hasSupabaseConfig()) {
      const supabase = getSupabaseAdminClient()
      const bucket = process.env.SUPABASE_STORAGE_BUCKET_CLUBS || "club-media"
      const storagePath = `clubs/${club.id}/tournament-posters/poster-${Date.now()}.${ext}`
      const uploadResult = await supabase.storage.from(bucket).upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })
      if (uploadResult.error) throw uploadResult.error
      publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
    } else {
      // Supabase no configurado: guardar localmente (public/uploads)
      publicUrl = await uploadToLocal(club.id, buffer, ext)
    }

    return NextResponse.json({
      success: true,
      data: {
        path: publicUrl,
        publicUrl,
      },
    })
  } catch (error) {
    console.error("Error uploading tournament poster:", error)
    const rawMessage =
      (error as { message?: string })?.message ??
      (error instanceof Error ? error.message : "Error al subir cartel")
    const message = String(rawMessage)

    const isEnvError =
      message.includes("Missing environment variable") ||
      message.includes("variables de entorno") ||
      message.includes("SUPABASE")
    const isBucketError =
      message.includes("Bucket not found") ||
      message.includes("bucket") ||
      message.toLowerCase().includes("storage") ||
      message.includes("not found")

    const userMessage = isEnvError
      ? "Configuración de almacenamiento incompleta. Añade NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
      : isBucketError
        ? `Bucket no encontrado. Crea el bucket '${process.env.SUPABASE_STORAGE_BUCKET_CLUBS || "club-media"}' en Supabase → Storage. Error: ${message}`
        : process.env.NODE_ENV === "development"
          ? message
          : "Error al subir cartel. Verifica el formato (JPG, PNG, WEBP) y que no supere 5MB."

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    )
  }
}

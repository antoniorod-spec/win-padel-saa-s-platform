import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { findOrCreatePlayerByPhone } from "@/lib/services/imported-roster-service"
import { findPlayerByPhone } from "@/lib/services/imported-roster-service"
import { z } from "zod"

const createFromPhoneSchema = z.object({
  phone: z.string().min(1, "Teléfono requerido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  email: z.string().email().optional().or(z.literal("")),
  sex: z.enum(["M", "F"]).optional(),
  suggestedCategory: z.string().optional(),
  sourceClubId: z.string().cuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAuth(["CLUB", "ADMIN"])
    if (error) return error

    const body = await request.json()
    const parsed = createFromPhoneSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await findPlayerByPhone(parsed.data.phone)
    if (existing) {
      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          firstName: existing.firstName,
          lastName: existing.lastName,
          created: false,
        },
        message: "El jugador ya existe en el sistema.",
      })
    }

    const playerId = await findOrCreatePlayerByPhone({
      phone: parsed.data.phone,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || undefined,
      sex: parsed.data.sex,
      sourceClubId: parsed.data.sourceClubId,
    })

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: "Teléfono inválido o no se pudo crear el jugador" },
        { status: 400 }
      )
    }

    const { prisma } = await import("@/lib/prisma")

    if (parsed.data.suggestedCategory?.trim()) {
      const cat = parsed.data.suggestedCategory.trim()
      const validCats = ["1ra", "2da", "3ra", "4ta", "5ta", "6ta"]
      if (validCats.includes(cat)) {
        const modality = parsed.data.sex === "F" ? "FEMENIL" : "VARONIL"
        await prisma.ranking.upsert({
          where: {
            playerId_modality_category_scope: {
              playerId,
              modality,
              category: cat,
              scope: "NATIONAL",
            },
          },
          update: {},
          create: {
            playerId,
            modality,
            category: cat,
            scope: "NATIONAL",
            associationId: null,
            points: 0,
            played: 0,
            wins: 0,
            losses: 0,
          },
        })
      }
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true, phone: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...player,
        created: true,
      },
      message: "Jugador creado correctamente.",
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating player from phone:", error)
    return NextResponse.json(
      { success: false, error: "Error al crear jugador" },
      { status: 500 }
    )
  }
}

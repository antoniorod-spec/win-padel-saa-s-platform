import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerPlayerSchema, registerClubSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type } = body

    // Verificar que el usuario no tenga ya un perfil
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { player: true, club: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (user.player || user.club) {
      return NextResponse.json(
        { success: false, error: "El usuario ya tiene un perfil" },
        { status: 400 }
      )
    }

    if (type === "player") {
      const parsed = registerPlayerSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { firstName, lastName, sex, city, country, age } = parsed.data

      // Actualizar usuario y crear perfil de jugador
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: `${firstName} ${lastName}`,
          role: "PLAYER",
          player: {
            create: {
              firstName,
              lastName,
              sex,
              city,
              country,
              age: age ?? null,
            },
          },
        },
        include: { player: true },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
          },
        },
        { status: 200 }
      )
    }

    if (type === "club") {
      const parsed = registerClubSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { clubName, city, courts } = parsed.data

      // Actualizar usuario y crear perfil de club
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: clubName,
          role: "CLUB",
          club: {
            create: {
              name: clubName,
              city,
              courts: courts ?? 0,
              status: "PENDING",
            },
          },
        },
        include: { club: true },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            clubStatus: "PENDING",
          },
          message: "Club registrado. Pendiente de aprobacion por un administrador.",
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Tipo de perfil invalido" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Complete profile error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

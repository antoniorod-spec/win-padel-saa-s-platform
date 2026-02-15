import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerPlayerSchema, registerClubSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "player") {
      const parsed = registerPlayerSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { email, password, firstName, lastName, sex, city, country, age } = parsed.data

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta con este correo" },
          { status: 409 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
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
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
        { status: 201 }
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

      const { email, password, clubName, city, courts } = parsed.data

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta con este correo" },
          { status: 409 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
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
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            clubStatus: "PENDING",
          },
          message: "Club registrado. Pendiente de aprobacion por un administrador.",
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Tipo de registro invalido" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

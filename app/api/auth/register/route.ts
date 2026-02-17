import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerPlayerSchema, registerPlayerInitialSchema, registerClubInitialSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === "player") {
      const parsedFull = registerPlayerSchema.safeParse(body)
      const parsedInitial = registerPlayerInitialSchema.safeParse(body)
      if (!parsedFull.success && !parsedInitial.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos" },
          { status: 400 }
        )
      }

      const isInitial = parsedInitial.success && !parsedFull.success
      let email: string
      let password: string

      if (parsedFull.success) {
        email = parsedFull.data.email
        password = parsedFull.data.password
      } else if (parsedInitial.success) {
        email = parsedInitial.data.email
        password = parsedInitial.data.password
      } else {
        return NextResponse.json(
          { success: false, error: "Datos invalidos" },
          { status: 400 }
        )
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta con este correo" },
          { status: 409 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)

      // Si viene el registro simplificado, crear un perfil base para evitar errores en /jugador
      const defaultFirstName = "Jugador"
      const defaultLastName = "Nuevo"

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: parsedFull.success ? `${parsedFull.data.firstName} ${parsedFull.data.lastName}` : `${defaultFirstName} ${defaultLastName}`,
          role: "PLAYER",
          player: {
            create: {
              firstName: parsedFull.success ? parsedFull.data.firstName : defaultFirstName,
              lastName: parsedFull.success ? parsedFull.data.lastName : defaultLastName,
              sex: parsedFull.success ? parsedFull.data.sex : "M",
              city: parsedFull.success ? parsedFull.data.city : "San Luis Potosi",
              country: parsedFull.success ? parsedFull.data.country : "MX",
              age: parsedFull.success ? (parsedFull.data.age ?? null) : null,
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
          message: isInitial ? "Cuenta creada. Ya puedes completar tu perfil más adelante." : undefined,
        },
        { status: 201 }
      )
    }

    if (type === "club") {
      // Registro simplificado: solo email y contraseña
      const parsed = registerClubInitialSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const { email, password } = parsed.data

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Ya existe una cuenta con este correo" },
          { status: 409 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 12)

      // Crear usuario SIN perfil de club (se completa en onboarding)
      // Se usa el rol default PLAYER temporalmente, se cambiará a CLUB en onboarding
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: "Club (pendiente)",
        },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            id: user.id,
            email: user.email,
          },
          message: "Cuenta creada. Completa tu perfil para continuar.",
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
    const debug = process.env.NODE_ENV !== "production" || process.env.DEBUG_API_ERRORS === "true"
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        ...(debug
          ? {
              // Expose only minimal safe fields for local debugging.
              details:
                error && typeof error === "object"
                  ? {
                      name: (error as any).name,
                      code: (error as any).code,
                      message: (error as any).message,
                      cause: (error as any).cause,
                    }
                  : { message: String(error) },
            }
          : null),
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerPlayerSchema, registerClubCompleteSchema } from "@/lib/validations/auth"

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
      const parsed = registerClubCompleteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const {
        // Paso 1: Responsable
        contactName,
        contactPhone,
        contactEmail,
        contactPosition,
        // Paso 2: Club
        clubName,
        legalName,
        rfc,
        clubPhone,
        clubEmail,
        website,
        // Paso 3: Ubicación
        country,
        state,
        city,
        address,
        postalCode,
        latitude,
        longitude,
        // Paso 4: Instalaciones
        indoorCourts,
        outdoorCourts,
        courtSurface,
        // Paso 5: Servicios
        hasParking,
        hasLockers,
        hasShowers,
        hasCafeteria,
        hasProShop,
        hasLighting,
        hasAirConditioning,
        operatingHours,
        priceRange,
        acceptsOnlineBooking,
        facebook,
        instagram,
      } = parsed.data

      const totalCourts = (indoorCourts || 0) + (outdoorCourts || 0)

      // Actualizar usuario y crear perfil de club
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: clubName,
          role: "CLUB",
          club: {
            create: {
              // Responsable
              contactName,
              contactPhone,
              contactEmail,
              contactPosition,
              // Club
              name: clubName,
              legalName,
              rfc,
              phone: clubPhone,
              email: clubEmail,
              website,
              // Ubicación
              country,
              state,
              city,
              address,
              postalCode,
              latitude,
              longitude,
              // Instalaciones
              indoorCourts,
              outdoorCourts,
              courts: totalCourts,
              courtSurface,
              // Servicios
              hasParking: !!hasParking,
              hasLockers: !!hasLockers,
              hasShowers: !!hasShowers,
              hasCafeteria: !!hasCafeteria,
              hasProShop: !!hasProShop,
              hasLighting: !!hasLighting,
              hasAirConditioning: !!hasAirConditioning,
              operatingHours: operatingHours as string | undefined,
              priceRange: priceRange as string | undefined,
              acceptsOnlineBooking: !!acceptsOnlineBooking,
              facebook: facebook as string | undefined,
              instagram: instagram as string | undefined,
              // Sistema
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

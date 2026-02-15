import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerPlayerCompleteSchema, registerClubCompleteSchema } from "@/lib/validations/auth"
import { reconcileImportedPlayerWithRegistered } from "@/lib/services/imported-roster-service"

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

    if (type === "player") {
      if (user.club) {
        return NextResponse.json(
          { success: false, error: "Este usuario ya es un club" },
          { status: 400 }
        )
      }

      const parsed = registerPlayerCompleteSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Datos invalidos", details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const {
        firstName, lastName, sex, city, state, country, age, phone, birthDate,
        documentType, documentNumber, courtPosition, dominantHand, starShot,
        playStyle, preferredMatchType, playsMixed, preferredSchedule, preferredAgeRange,
      } = parsed.data

      // Actualizar usuario y crear/actualizar perfil de jugador
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: `${firstName} ${lastName}`,
          role: "PLAYER",
          player: {
            upsert: {
              create: {
                firstName,
                lastName,
                sex,
                city,
                state,
                country,
                age: age ?? null,
                phone,
                birthDate: new Date(birthDate),
                documentType,
                documentNumber,
                courtPosition,
                dominantHand,
                starShot,
                playStyle,
                preferredMatchType,
                playsMixed,
                preferredSchedule,
                preferredAgeRange,
              },
              update: {
              firstName,
              lastName,
              sex,
              city,
              state,
              country,
              age: age ?? null,
              phone,
              birthDate: new Date(birthDate),
              documentType,
              documentNumber,
              courtPosition,
              dominantHand,
              starShot,
              playStyle,
              preferredMatchType,
              playsMixed,
              preferredSchedule,
              preferredAgeRange,
              },
            },
          },
        },
        include: { player: true },
      })

      if (updatedUser.player) {
        await reconcileImportedPlayerWithRegistered({
          playerId: updatedUser.player.id,
          firstName,
          lastName,
          phone,
        })
      }

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
      if (user.club || user.player) {
        return NextResponse.json(
          { success: false, error: "El usuario ya tiene un perfil" },
          { status: 400 }
        )
      }

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
        neighborhood,
        latitude,
        longitude,
        // Paso 4: Instalaciones
        indoorCourts,
        outdoorCourts,
        courtSurface,
        courtSurfaces,
        // Paso 5: Servicios
        hasParking,
        hasLockers,
        hasShowers,
        hasCafeteria,
        hasProShop,
        hasLighting,
        hasAirConditioning,
        operatingHours,
        weeklySchedule,
        priceRange,
        acceptsOnlineBooking,
        services,
        photos,
        logoUrl,
        facebook,
        instagram,
        tiktok,
        youtube,
        linkedin,
        x,
        whatsapp,
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
              neighborhood,
              latitude,
              longitude,
              // Instalaciones
              indoorCourts,
              outdoorCourts,
              courts: totalCourts,
              courtSurface,
              courtSurfaces: courtSurfaces ?? undefined,
              // Servicios
              hasParking: !!hasParking,
              hasLockers: !!hasLockers,
              hasShowers: !!hasShowers,
              hasCafeteria: !!hasCafeteria,
              hasProShop: !!hasProShop,
              hasLighting: !!hasLighting,
              hasAirConditioning: !!hasAirConditioning,
              operatingHours: operatingHours as string | undefined,
              weeklySchedule: weeklySchedule ?? undefined,
              priceRange: priceRange as string | undefined,
              acceptsOnlineBooking: !!acceptsOnlineBooking,
              services: services ?? undefined,
              photos: photos ?? undefined,
              logoUrl: logoUrl as string | undefined,
              facebook: facebook as string | undefined,
              instagram: instagram as string | undefined,
              tiktok: tiktok as string | undefined,
              youtube: youtube as string | undefined,
              linkedin: linkedin as string | undefined,
              x: x as string | undefined,
              whatsapp: whatsapp as string | undefined,
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

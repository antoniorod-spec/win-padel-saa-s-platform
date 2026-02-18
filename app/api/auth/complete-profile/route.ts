import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { registerPlayerCompleteSchema, registerClubCompleteSchema } from "@/lib/validations/auth"
import { reconcileImportedPlayerWithRegistered } from "@/lib/services/imported-roster-service"
import { normalizePhone } from "@/lib/utils/file-parser"

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
        firstName,
        lastName,
        sex,
        city,
        state,
        postalCode,
        country,
        age,
        phone,
        birthDate,
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
        homeClubId,
        preferredPartnerId,
      } = parsed.data

      const clean = (value?: string | null) => {
        const v = (value ?? "").trim()
        return v ? v : undefined
      }

      const optionalDate = (value?: string | null) => {
        const v = clean(value)
        if (!v) return undefined
        const d = new Date(v)
        return Number.isNaN(d.getTime()) ? undefined : d
      }

      const playerCreate: Record<string, unknown> = {
        firstName,
        lastName,
        city,
      }
      const playerUpdate: Record<string, unknown> = {
        firstName,
        lastName,
        city,
      }

      // Optional fields: only persist when provided to avoid wiping previously saved data.
      const maybeSet = (key: string, value: unknown) => {
        if (value === undefined) return
        playerCreate[key] = value
        playerUpdate[key] = value
      }

      maybeSet("sex", sex)
      maybeSet("state", clean(state))
      maybeSet("postalCode", clean(postalCode))
      maybeSet("country", clean(country))
      maybeSet("age", typeof age === "number" ? age : undefined)
      maybeSet("phone", normalizePhone(clean(phone)) || clean(phone))
      maybeSet("birthDate", optionalDate(birthDate))
      maybeSet("documentType", clean(documentType))
      maybeSet("documentNumber", clean(documentNumber))
      maybeSet("courtPosition", clean(courtPosition))
      maybeSet("dominantHand", clean(dominantHand))
      maybeSet("starShot", clean(starShot))
      maybeSet("playStyle", clean(playStyle))
      maybeSet("preferredMatchType", clean(preferredMatchType))
      maybeSet("playsMixed", typeof playsMixed === "boolean" ? playsMixed : undefined)
      maybeSet("preferredSchedule", clean(preferredSchedule))
      maybeSet("preferredAgeRange", clean(preferredAgeRange))
      maybeSet("homeClubId", clean(homeClubId))
      maybeSet("preferredPartnerId", clean(preferredPartnerId))

      // Actualizar usuario y crear/actualizar perfil de jugador
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: `${firstName} ${lastName}`,
          role: "PLAYER",
          player: {
            upsert: {
              create: playerCreate as any,
              update: playerUpdate as any,
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
        placeId,
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

      const cleanPlaceId = typeof placeId === "string" && placeId.trim() ? placeId.trim() : undefined

      if (cleanPlaceId) {
        const existing = await prisma.club.findUnique({ where: { placeId: cleanPlaceId } })
        if (existing?.userId) {
          return NextResponse.json(
            { success: false, error: "Este club ya fue reclamado" },
            { status: 409 }
          )
        }

        if (existing) {
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: session.user.id },
              data: {
                name: clubName,
                role: "CLUB",
                club: { connect: { id: existing.id } },
              },
            })

            await tx.club.update({
              where: { id: existing.id },
              data: {
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
                // Sistema: al reclamar requiere revisión.
                status: "PENDING",
              },
            })
          })

          return NextResponse.json(
            {
              success: true,
              data: {
                id: session.user.id,
                email: session.user.email,
                name: clubName,
                role: "CLUB",
                clubStatus: "PENDING",
              },
              message: "Club reclamado. Pendiente de aprobacion por un administrador.",
            },
            { status: 200 }
          )
        }
      }

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
              placeId: cleanPlaceId,
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

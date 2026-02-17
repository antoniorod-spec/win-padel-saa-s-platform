import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Creates a minimal Player profile so the user can continue and fill details later.
// Important: it never overwrites an existing Player profile.
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { player: true, club: true },
    })
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }
    if (user.club) {
      return NextResponse.json({ success: false, error: "Este usuario ya es un club" }, { status: 400 })
    }

    const fullName = (user.name || "").trim()
    const parts = fullName ? fullName.split(/\s+/).filter(Boolean) : []
    const fallbackFirstName = (parts[0] || "Jugador").slice(0, 64)
    const fallbackLastName = (parts.slice(1).join(" ") || "Pendiente").slice(0, 64)

    const clean = (value: string | null | undefined) => {
      const v = (value ?? "").trim()
      return v ? v : undefined
    }

    if (user.player) {
      // Ensure the minimal completion rule is satisfied to avoid redirect loops.
      const nextFirstName = clean(user.player.firstName) ?? fallbackFirstName
      const nextLastName = clean(user.player.lastName) ?? fallbackLastName
      const nextCity = clean(user.player.city) ?? "Por completar"

      if (
        nextFirstName !== user.player.firstName ||
        nextLastName !== user.player.lastName ||
        nextCity !== user.player.city ||
        user.role !== "PLAYER"
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "PLAYER",
            name: fullName || `${nextFirstName} ${nextLastName}`.trim(),
            player: {
              update: {
                firstName: nextFirstName,
                lastName: nextLastName,
                city: nextCity,
              },
            },
          },
        })
      }

      return NextResponse.json({ success: true, data: { playerId: user.player.id } }, { status: 200 })
    }

    const firstName = fallbackFirstName
    const lastName = fallbackLastName

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "PLAYER",
        name: fullName || `${firstName} ${lastName}`.trim(),
        player: {
          create: {
            firstName,
            lastName,
            city: "Por completar",
            country: "MX",
            sex: "M",
          },
        },
      },
      include: { player: true },
    })

    return NextResponse.json({ success: true, data: { playerId: updated.player?.id } }, { status: 201 })
  } catch (error) {
    console.error("Defer profile error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}


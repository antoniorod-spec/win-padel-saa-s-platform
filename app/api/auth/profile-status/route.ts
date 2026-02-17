import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function isPlayerProfileComplete(player: {
  firstName: string
  lastName: string
  city: string
}) {
  return Boolean(
    player.firstName &&
      player.lastName &&
      player.city
  )
}

function isClubProfileComplete(club: {
  name: string
  rfc: string | null
  phone: string | null
  contactName: string | null
  contactPhone: string | null
  country: string
  state: string
  city: string
  address: string
  indoorCourts: number
  outdoorCourts: number
}) {
  return Boolean(
    club.name &&
      club.rfc &&
      club.phone &&
      club.contactName &&
      club.contactPhone &&
      club.country &&
      club.state &&
      club.city &&
      club.address &&
      club.indoorCourts + club.outdoorCourts >= 1
  )
}

export async function GET() {
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

  return NextResponse.json({
    success: true,
    data: {
      role: user.role,
      hasPlayer: !!user.player,
      hasClub: !!user.club,
      isPendingClub: user.name === "Club (pendiente)",
      isPlayerProfileComplete: user.player ? isPlayerProfileComplete(user.player) : false,
      isClubProfileComplete: user.club ? isClubProfileComplete(user.club) : false,
    },
  })
}

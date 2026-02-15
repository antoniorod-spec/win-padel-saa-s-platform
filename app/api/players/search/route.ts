import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Sex, Modality } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const name = searchParams.get("name") || ""
    const modality = searchParams.get("modality") || undefined
    const category = searchParams.get("category") || undefined
    const sex = searchParams.get("sex") || undefined

    const players = await prisma.player.findMany({
      where: {
        AND: [
          name
            ? {
                OR: [
                  { firstName: { contains: name, mode: "insensitive" } },
                  { lastName: { contains: name, mode: "insensitive" } },
                ],
              }
            : {},
          sex ? { sex: sex as Sex } : {},
        ],
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
        rankings: modality && category ? {
          where: {
            modality: modality as Modality,
            category,
          },
        } : true,
      },
      take: 20,
      orderBy: { firstName: "asc" },
    })

    const formattedPlayers = players.map((player) => ({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      fullName: `${player.firstName} ${player.lastName}`,
      city: player.city,
      country: player.country,
      sex: player.sex,
      avatarUrl: player.user.image,
      rankings: player.rankings,
    }))

    return NextResponse.json({
      success: true,
      data: formattedPlayers,
    })
  } catch (error) {
    console.error("Error searching players:", error)
    return NextResponse.json(
      { success: false, error: "Error al buscar jugadores" },
      { status: 500 }
    )
  }
}

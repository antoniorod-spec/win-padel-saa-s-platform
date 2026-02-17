import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const { token } = await params
    const safeToken = (token || "").trim()
    if (!safeToken) {
      return NextResponse.json({ success: false, error: "Token invalido" }, { status: 400 })
    }

    const acceptorUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { player: true },
    })
    if (!acceptorUser?.player) {
      return NextResponse.json({ success: false, error: "Perfil de jugador no encontrado" }, { status: 404 })
    }

    const invite = await prisma.playerPartnerInvite.findUnique({
      where: { token: safeToken },
    })
    if (!invite) {
      return NextResponse.json({ success: false, error: "Invitacion no encontrada" }, { status: 404 })
    }
    if (invite.acceptedAt || invite.acceptedPlayerId) {
      return NextResponse.json({ success: false, error: "Invitacion ya aceptada" }, { status: 409 })
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "Invitacion expirada" }, { status: 410 })
    }

    // Do everything atomically.
    const result = await prisma.$transaction(async (tx) => {
      const updatedInvite = await tx.playerPartnerInvite.update({
        where: { token: safeToken },
        data: {
          acceptedPlayerId: acceptorUser.player!.id,
          acceptedAt: new Date(),
        },
      })

      // Mutual link by default.
      await tx.player.update({
        where: { id: invite.inviterPlayerId },
        data: { preferredPartnerId: acceptorUser.player!.id },
      })
      await tx.player.update({
        where: { id: acceptorUser.player!.id },
        data: { preferredPartnerId: invite.inviterPlayerId },
      })

      return updatedInvite
    })

    return NextResponse.json({ success: true, data: { acceptedAt: result.acceptedAt } }, { status: 200 })
  } catch (error) {
    console.error("Partner invite accept error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}


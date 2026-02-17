import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const inviteeEmail = typeof body?.inviteeEmail === "string" ? body.inviteeEmail.trim() : ""
    const inviteePhone = typeof body?.inviteePhone === "string" ? body.inviteePhone.trim() : ""

    const inviterUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { player: true },
    })
    if (!inviterUser?.player) {
      return NextResponse.json({ success: false, error: "Perfil de jugador no encontrado" }, { status: 404 })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invite = await prisma.playerPartnerInvite.create({
      data: {
        token,
        inviterPlayerId: inviterUser.player.id,
        inviteeEmail: inviteeEmail || null,
        inviteePhone: inviteePhone || null,
        expiresAt,
      },
    })

    const origin = request.nextUrl.origin
    const inviteUrl = `${origin}/partner-invite/${encodeURIComponent(invite.token)}`

    return NextResponse.json({ success: true, data: { inviteUrl, expiresAt: invite.expiresAt } }, { status: 201 })
  } catch (error) {
    console.error("Partner invite create error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}


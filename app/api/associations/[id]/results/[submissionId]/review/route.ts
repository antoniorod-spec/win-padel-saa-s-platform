import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { applyApprovedResultSubmission } from "@/lib/services/ranking-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const { id, submissionId } = await params
    const { error } = await requireAuth(["ADMIN"])
    if (error) return error

    const association = await prisma.association.findUnique({ where: { id } })
    if (!association) {
      return NextResponse.json({ success: false, error: "Asociacion no encontrada" }, { status: 404 })
    }

    const body = await request.json()
    const action = body?.action === "reject" ? "reject" : "approve"
    const notes = typeof body?.notes === "string" ? body.notes : undefined

    const submission = await prisma.tournamentResultSubmission.findUnique({
      where: { id: submissionId },
      include: { tournament: true },
    })
    if (!submission) {
      return NextResponse.json({ success: false, error: "Envio no encontrado" }, { status: 404 })
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED"
    await prisma.tournamentResultSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        validatedAt: new Date(),
        validatedByAssociationId: association.id,
        validationNotes: notes ?? null,
      },
    })

    await prisma.tournament.update({
      where: { id: submission.tournamentId },
      data: {
        resultsValidationStatus: status,
        validatedAt: new Date(),
        validatedByAssociationId: association.id,
        validationNotes: notes ?? null,
      },
    })

    if (action === "approve") {
      await applyApprovedResultSubmission(submissionId, association.id)
    }

    return NextResponse.json({ success: true, data: { submissionId, status } })
  } catch (err) {
    console.error("Error reviewing submission:", err)
    return NextResponse.json({ success: false, error: "Error al revisar resultados" }, { status: 500 })
  }
}

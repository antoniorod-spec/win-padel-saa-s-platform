import { NextResponse } from "next/server"
import { POINTS_TABLE } from "@/lib/types"

export async function GET() {
  return NextResponse.json({
    success: true,
    data: POINTS_TABLE,
  })
}

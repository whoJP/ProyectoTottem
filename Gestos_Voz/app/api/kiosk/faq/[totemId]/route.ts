import "@/lib/register-models"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Totem from "@/models/Totem"
import { loadKioskFaqForTotem } from "@/lib/kiosk-faq"
import { resolveTotemQuery } from "@/lib/kiosk-totem"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ totemId: string }> }
) {
  try {
    await connectDB()
    const { totemId } = await params

    const totem = await Totem.findOne(resolveTotemQuery(totemId)).select(
      "_id totem_id campus_id"
    )

    const mongoId = totem ? String(totem._id) : totemId
    const totemIdStr = totem ? String(totem.totem_id || totem._id) : totemId
    const campusId = totem ? String(totem.campus_id ?? "") : ""

    const faq = await loadKioskFaqForTotem(mongoId, totemIdStr, campusId)

    if (!faq) {
      return NextResponse.json(
        { error: "No hay FAQ activa para este tótem" },
        { status: 404 }
      )
    }

    return NextResponse.json(faq)
  } catch (error) {
    console.error("Error GET kiosk faq:", error)
    return NextResponse.json(
      { error: "Error al obtener FAQ" },
      { status: 500 }
    )
  }
}

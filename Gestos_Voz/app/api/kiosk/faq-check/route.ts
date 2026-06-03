import "@/lib/register-models"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Faq from "@/models/Faq"
import Totem from "@/models/Totem"
import { loadKioskFaqForTotem } from "@/lib/kiosk-faq"
import { resolveTotemQuery } from "@/lib/kiosk-totem"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Diagnóstico: ?totemId=ID del tótem en sesión */
export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const totemId = searchParams.get("totemId")?.trim() ?? ""

    if (!totemId) {
      return NextResponse.json(
        { error: "Pase ?totemId= con el ID de la sesión del tótem" },
        { status: 400 }
      )
    }

    const totem = await Totem.findOne(resolveTotemQuery(totemId))
      .select("_id totem_id nombre campus_id")
      .lean()

    const mongoId = totem ? String(totem._id) : totemId
    const totemIdStr = totem
      ? String(totem.totem_id || totem._id)
      : totemId

    const faqCount = await Faq.countDocuments({ isActive: true })
    const faqWithItems = await Faq.countDocuments({
      isActive: true,
      "items.0": { $exists: true },
    })

    const loaded = await loadKioskFaqForTotem(
      mongoId,
      totemIdStr,
      totem ? String(totem.campus_id ?? "") : ""
    )

    return NextResponse.json({
      totemEnSesion: totemId,
      totemEncontrado: totem
        ? {
            _id: String(totem._id),
            totem_id: totem.totem_id,
            nombre: totem.nombre,
          }
        : null,
      faqsActivosEnBd: faqCount,
      faqsConItemsEnBd: faqWithItems,
      preguntasCargadasEnApp: loaded?.items?.length ?? 0,
      tituloFaq: loaded?.title ?? null,
      muestraKeywords: loaded?.items?.slice(0, 5).map((i) => i.keyword) ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

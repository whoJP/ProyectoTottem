import "@/lib/register-models"
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Totem from "@/models/Totem"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const usuario = String(body?.usuario ?? "").trim()
    const contraseña = String(body?.contraseña ?? body?.password ?? "").trim()

    if (!usuario || !contraseña) {
      return NextResponse.json(
        { error: "Usuario y contraseña son obligatorios" },
        { status: 400 }
      )
    }

    const totem = await Totem.findOne({
      $or: [
        {
          "credenciales.usuario": usuario,
          "credenciales.contraseña": contraseña,
        },
        {
          "credenciales.usuario": usuario,
          "credenciales.password": contraseña,
        },
      ],
    }).select("_id nombre estado totem_id campus_id")

    if (!totem) {
      return NextResponse.json(
        { error: "Credenciales incorrectas para este tótem" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      totemId: String(totem._id),
      totem_id: String(totem.totem_id || totem._id),
      nombre: totem.nombre,
      estado: totem.estado,
    })
  } catch (error) {
    console.error("Error POST kiosk login:", error)
    return NextResponse.json(
      { error: "Error al iniciar sesión del tótem" },
      { status: 500 }
    )
  }
}

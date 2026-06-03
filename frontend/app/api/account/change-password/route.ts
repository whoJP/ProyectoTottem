import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/auth"
import {
  isStrongPassword,
  STRONG_PASSWORD_MESSAGE,
} from "@/lib/password-validation"
import Admin from "@/models/Admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const authResult = await requireAuth(request)
  if ("response" in authResult) return authResult.response

  let body: {
    contrasenaActual?: string
    nuevaContrasena?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 })
  }

  const { contrasenaActual, nuevaContrasena } = body

  if (!contrasenaActual || !nuevaContrasena) {
    return NextResponse.json(
      { message: "Debes indicar la contraseña actual y la nueva." },
      { status: 400 }
    )
  }

  if (!isStrongPassword(nuevaContrasena)) {
    return NextResponse.json({ message: STRONG_PASSWORD_MESSAGE }, { status: 400 })
  }

  try {
    await connectDB()

    const admin = await Admin.findById(authResult.auth.adminId)
    if (!admin) {
      return NextResponse.json({ message: "Usuario no encontrado." }, { status: 404 })
    }

    const stored = admin.contraseña as string
    if (!stored?.startsWith("$2")) {
      return NextResponse.json(
        { message: "No se puede validar la contraseña actual." },
        { status: 500 }
      )
    }

    const valid = await bcrypt.compare(contrasenaActual, stored)
    if (!valid) {
      return NextResponse.json(
        { message: "La contraseña actual no es correcta." },
        { status: 401 }
      )
    }

    const same = await bcrypt.compare(nuevaContrasena, stored)
    if (same) {
      return NextResponse.json(
        { message: "La nueva contraseña debe ser distinta a la actual." },
        { status: 400 }
      )
    }

    admin.contraseña = await bcrypt.hash(nuevaContrasena, 12)
    admin.resetPasswordToken = null
    admin.resetPasswordExpires = null
    admin.tokenVersion = (admin.tokenVersion ?? 0) + 1
    await admin.save()

    return NextResponse.json({
      message: "Contraseña actualizada. Inicia sesión de nuevo.",
    })
  } catch (error) {
    console.error("Error change-password:", error)
    return NextResponse.json(
      { message: "Error al actualizar la contraseña." },
      { status: 500 }
    )
  }
}

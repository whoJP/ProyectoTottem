import { NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import connectDB from "@/lib/mongodb"
import Admin from "@/models/Admin"

export const runtime = "nodejs"

function validarContrasenaFuerte(password: string) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  return regex.test(password)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  let body: { nuevaContrasena?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 })
  }

  const { nuevaContrasena } = body

  if (!token || !nuevaContrasena) {
    return NextResponse.json(
      { message: "Token y nueva contraseña son requeridos." },
      { status: 400 }
    )
  }

  if (!validarContrasenaFuerte(nuevaContrasena)) {
    return NextResponse.json(
      {
        message:
          "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
      },
      { status: 400 }
    )
  }

  try {
    await connectDB()

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!admin) {
      return NextResponse.json(
        { message: "El enlace no es válido o ha expirado." },
        { status: 400 }
      )
    }

    admin.contraseña = await bcrypt.hash(nuevaContrasena, 12)
    admin.resetPasswordToken = null
    admin.resetPasswordExpires = null
    admin.failedLoginAttempts = 0
    admin.lockUntil = null
    admin.tokenVersion = (admin.tokenVersion ?? 0) + 1
    await admin.save()

    return NextResponse.json({
      message: "Contraseña actualizada correctamente.",
    })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json(
      { message: "Error interno del servidor." },
      { status: 500 }
    )
  }
}

export function generateTotemCredentials() {
  const randomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"
  let pass = ""
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return {
    usuario: `TOTEM_${randomId}`,
    contraseña: pass,
  }
}

export function readPasswordFromFormData(formData: FormData): string {
  const raw =
    formData.get("contraseña") ?? formData.get("contrasena") ?? formData.get("password")
  return typeof raw === "string" ? raw : ""
}

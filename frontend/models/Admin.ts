import { Schema, model, models } from "mongoose"

const AdminSchema = new Schema(
  {
    admin_id: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    correo_electronico: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contraseña: { type: String, required: true },
    rol: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    campus_id: {
      type: String,
      enum: ["cochabamba", "santa-cruz", "la-paz"],
      default: null,
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const Admin = models.Admin || model("Admin", AdminSchema, "admins")

export default Admin

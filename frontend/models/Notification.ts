import { Schema, model, models } from "mongoose"

const NotificationSchema = new Schema(
  {
    totem_id: { type: String, required: true },
    fechaInicio: { type: String, required: true },
    fechaFin: { type: String, required: true },
    mensaje: { type: String, required: true },
    archivo: { type: String, default: "no" },
    archivoFileId: { type: Schema.Types.ObjectId, default: null },
    archivoContentType: { type: String, default: null },
  },
  { timestamps: true, collection: "notifications" }
)

const Notification =
  models.Notification || model("Notification", NotificationSchema)

export default Notification

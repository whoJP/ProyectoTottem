import mongoose, { Schema, model, models } from "mongoose"

const ContentSchema = new Schema({
  content_id: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ["imagen", "video"], required: true },
  nombre: { type: String, required: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
  url_contenido: { type: String, required: true },
  descripcion: { type: String },
}, {
  timestamps: true
})

const Content = models.Content || model("Content", ContentSchema, "contents")

export default Content
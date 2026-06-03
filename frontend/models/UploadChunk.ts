import { Schema, model, models } from "mongoose"

const UploadChunkSchema = new Schema(
  {
    uploadId: { type: String, required: true, index: true },
    index: { type: Number, required: true },
    data: { type: Buffer, required: true },
    fileName: { type: String, required: true },
    contentType: { type: String, default: "application/octet-stream" },
    slot: { type: String, required: true },
    nombreTotem: { type: String, default: "tótem" },
    totalChunks: { type: Number, required: true },
  },
  { timestamps: true }
)

UploadChunkSchema.index({ uploadId: 1, index: 1 }, { unique: true })
UploadChunkSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 6 })

const UploadChunk =
  models.UploadChunk || model("UploadChunk", UploadChunkSchema, "upload_chunks")

export default UploadChunk

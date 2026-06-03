import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
    isActive: { type: Boolean, default: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "campuses", default: null },
    totemId: { type: mongoose.Schema.Types.ObjectId, ref: "totems", default: null },
    durationSeconds: { type: Number, default: 10 }
  },
  { timestamps: true, collection: "ads" }
);

export default mongoose.model("Ad", adSchema);
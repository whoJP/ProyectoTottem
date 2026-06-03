import mongoose from "mongoose";

const totemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "campuses" },
    status: { type: String, default: "active" }
  },
  { timestamps: true, collection: "totems" }
);

export default mongoose.model("Totem", totemSchema);
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: "faq_pdf" },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mimeType: { type: String, default: "application/pdf" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "admins", default: null },
    extractedText: { type: String, default: "" }
  },
  { timestamps: true, collection: "documents" }
);

export default mongoose.model("Document", documentSchema);
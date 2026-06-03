import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "campuses", default: null },
    totemId: { type: mongoose.Schema.Types.ObjectId, ref: "totems", default: null },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "documents" },
    pdfFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "faqs" }
);

export default mongoose.model("Faq", faqSchema);
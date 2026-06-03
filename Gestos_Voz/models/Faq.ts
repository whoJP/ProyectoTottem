import { Schema, model, models } from "mongoose"

const FaqSchema = new Schema(
  {
    title: { type: String, required: true },
    campusId: { type: Schema.Types.ObjectId, default: null },
    totemId: { type: Schema.Types.Mixed, default: null },
    documentId: { type: Schema.Types.ObjectId, default: null },
    pdfFileId: { type: Schema.Types.ObjectId },
    items: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        keyword: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "faqs" }
)

const Faq = models.Faq || model("Faq", FaqSchema)

export default Faq

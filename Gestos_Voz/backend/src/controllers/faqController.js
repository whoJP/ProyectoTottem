import multer from "multer";
import { ObjectId } from "mongodb";
import { getGridFSBucket } from "../config/gridfs.js";
import Document from "../models/Document.js";
import Faq from "../models/Faq.js";
import { extractTextFromPdfBuffer, parseFaqText } from "../services/pdfService.js";
import { Readable } from "stream";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadFaqPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Debes subir un PDF" });
    }

    const bucket = getGridFSBucket();

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: req.file.mimetype
    });

    const readablePdfStream = Readable.from(req.file.buffer);
    readablePdfStream.pipe(uploadStream);

    uploadStream.on("error", (err) => {
      return res.status(500).json({ message: "Error guardando PDF en GridFS", error: err.message });
    });

    uploadStream.on("finish", async () => {
      try {
        const extractedText = await extractTextFromPdfBuffer(req.file.buffer);
        const items = parseFaqText(extractedText);

        if (!items.length) {
          return res.status(400).json({
            message: "No se pudieron extraer preguntas/respuestas del PDF. Verifica el formato."
          });
        }

        const document = await Document.create({
          name: req.file.originalname,
          type: "faq_pdf",
          fileId: uploadStream.id,
          mimeType: req.file.mimetype,
          extractedText
        });

        const faq = await Faq.create({
          title: req.body.title || "Preguntas frecuentes",
          campusId: req.body.campusId || null,
          totemId: req.body.totemId || null,
          documentId: document._id,
          pdfFileId: uploadStream.id,
          items,
          isActive: true
        });

        res.status(201).json({
          message: "PDF subido y FAQ generada correctamente",
          faq
        });
      } catch (error) {
        res.status(500).json({
          message: "Error procesando PDF",
          error: error.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error general al subir PDF",
      error: error.message
    });
  }
};

export const getFaqByTotem = async (req, res) => {
  try {
    const { totemId } = req.params;

    const faq = await Faq.findOne({
      $or: [
        { totemId: totemId },
        { totemId: null }
      ],
      isActive: true
    }).sort({ createdAt: -1 });

    if (!faq) {
      return res.status(404).json({ message: "No hay FAQ activa para este tótem" });
    }

    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo FAQ", error: error.message });
  }
};
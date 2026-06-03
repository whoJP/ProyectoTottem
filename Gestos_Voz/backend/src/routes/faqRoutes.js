import express from "express";
import { getFaqByTotem, upload, uploadFaqPdf } from "../controllers/faqController.js";


const router = express.Router();

router.post("/upload-pdf", upload.single("pdf"), uploadFaqPdf);
router.get("/totem/:totemId", getFaqByTotem);

export default router;
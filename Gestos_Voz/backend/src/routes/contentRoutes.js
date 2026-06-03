import express from "express";
import { getAdsByTotem } from "../controllers/contentController.js";

const router = express.Router();

router.get("/ads/totem/:totemId", getAdsByTotem);

export default router;
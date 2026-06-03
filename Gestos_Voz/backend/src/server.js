import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import { initGridFS } from "./config/gridfs.js";
import faqRoutes from "./routes/faqRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/faqs", faqRoutes);
app.use("/api/content", contentRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "API Sistema Totems funcionando" });
});

const startServer = async () => {
  await connectDB();

  mongoose.connection.once("open", () => {
    initGridFS();

    app.listen(process.env.PORT || 4000, () => {
      console.log(`Servidor corriendo en puerto ${process.env.PORT || 4000}`);
    });
  });
};

startServer();
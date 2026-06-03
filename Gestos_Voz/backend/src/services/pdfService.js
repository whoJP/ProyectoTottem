import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractTextFromPdfBuffer = async (buffer) => {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
};

export const parseFaqText = (text) => {
  const normalized = text.replace(/\s+/g, " ").trim();

  const regex = /PREGUNTA:\s*(.*?)\s*RESPUESTA:\s*(.*?)(?=PREGUNTA:|$)/gi;
  const items = [];
  let match;

  while ((match = regex.exec(normalized)) !== null) {
    items.push({
      question: match[1].trim(),
      answer: match[2].trim()
    });
  }

  return items;
};
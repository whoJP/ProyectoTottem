const API_URL = "http://localhost:4000/api";

const fallbackAds = [
  {
    title: "Publicidad Institucional 1",
    mediaUrl: "https://via.placeholder.com/1280x720?text=Publicidad+1",
    type: "image",
    durationSeconds: 6,
  },
  {
    title: "Publicidad Institucional 2",
    mediaUrl: "https://via.placeholder.com/1280x720?text=Publicidad+2",
    type: "image",
    durationSeconds: 6,
  },
];

const fallbackFaq = {
  title: "Preguntas Frecuentes",
  items: [
    {
      question: "¿Dónde pago mi matrícula?",
      answer: "Puede realizar el pago en cajas o mediante la plataforma virtual.",
    },
    {
      question: "¿Cuál es el horario de atención?",
      answer: "Lunes a viernes de 8:00 a 18:00.",
    },
    {
      question: "¿Dónde solicito certificados?",
      answer: "En la oficina de registros o por el portal institucional.",
    },
  ],
};

export async function getAdsByTotem(totemId) {
  try {
    const response = await fetch(`${API_URL}/content/ads/totem/${totemId}`);

    if (!response.ok) {
      throw new Error("No se pudo obtener publicidad");
    }

    return await response.json();
  } catch (error) {
    console.warn("Usando publicidad local:", error.message);
    return fallbackAds;
  }
}

export async function getFaqByTotem(totemId) {
  try {
    const response = await fetch(`${API_URL}/faqs/totem/${totemId}`);

    if (!response.ok) {
      throw new Error("No se pudo obtener FAQ");
    }

    return await response.json();
  } catch (error) {
    console.warn("Usando FAQ local:", error.message);
    return fallbackFaq;
  }
}
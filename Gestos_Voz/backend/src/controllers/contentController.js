import Ad from "../models/Ad.js";

export const getAdsByTotem = async (req, res) => {
  try {
    const { totemId } = req.params;

    const ads = await Ad.find({
      $or: [
        { totemId: totemId },
        { totemId: null }
      ],
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo publicidad", error: error.message });
  }
};
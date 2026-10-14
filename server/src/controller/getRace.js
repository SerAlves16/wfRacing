const Race = require("../models/raceSchema");

exports.getLastRaceId = async (req, res) => {
  try {
    const lastRace = await Race.findOne().sort({ _id: -1 }); // Obtém o último documento inserido
    if (!lastRace) {
      return res.status(404).json({ message: "Nenhuma corrida encontrada" });
    }
    res.json({ lastRaceText: lastRace.race });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar o texto da última corrida" });
  }
};

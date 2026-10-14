const Race = require("../models/raceSchema");

exports.addRace = async (req, res) => {
  try {
    const { race } = req.body; // Alterado para req.body.race
    const newRace = new Race({ race }); // Alterado para race
    await newRace.save();
    res.status(201).json({ message: "Corrida adicionada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao adicionar corrida" });
  }
};

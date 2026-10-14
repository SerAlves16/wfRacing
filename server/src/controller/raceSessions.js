const Race = require('../models/raceSchema');
const { createNext } = require('../services/raceService');

exports.list = async (req, res) => {
  try { res.json(await Race.find({ number: { $exists: true } }).sort({ number: 1 })); }
  catch { res.status(500).json({ message: 'Não foi possível consultar as corridas.' }); }
};
exports.createNext = async (req, res) => {
  const { currentRace } = req.body || {};
  if (!Number.isSafeInteger(currentRace) || currentRace < 1) return res.status(400).json({ message: 'Número de corrida atual inválido.' });
  try {
    const session = await createNext(currentRace);
    res.status(201).json({ number: session.number, session });
  } catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível criar a nova corrida.' }); }
};

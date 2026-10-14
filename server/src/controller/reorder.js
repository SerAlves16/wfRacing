const mongoose = require('mongoose');
const Dados = require('../models/schema');
exports.reorder = async (req, res) => {
  const { id, adjacentId } = req.body;
  if (!mongoose.isObjectIdOrHexString(id) || !mongoose.isObjectIdOrHexString(adjacentId) || id === adjacentId) return res.status(400).json({ message: 'Invalid incident IDs' });
  try {
    const data = await Dados.find().sort({ indice: 1, _id: 1 });
    const from = data.findIndex(item => String(item._id) === id);
    const to = data.findIndex(item => String(item._id) === adjacentId);
    if (from < 0 || to < 0) return res.status(404).json({ message: 'Incident not found' });
    // Normalize positions, including legacy documents without an indice, without changing their content.
    [data[from], data[to]] = [data[to], data[from]];
    await Dados.bulkWrite(data.map((item, indice) => ({ updateOne: { filter: { _id: item._id }, update: { $set: { indice } } } })));
    res.json({ message: 'Order updated' });
  } catch { res.status(500).json({ message: 'Unable to reorder incidents' }); }
};


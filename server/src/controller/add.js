const incidents = require('../services/incidentService');
exports.addData = async (req, res) => {
  try { await incidents.create(req.body); res.json({ message: 'Dados adicionados com sucesso.' }); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao adicionar dados.' }); }
};

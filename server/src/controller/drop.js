const incidents = require('../services/incidentService');
exports.dropData = async (req, res) => {
  try { await incidents.clear(); res.json({ message: 'Todos os dados foram removidos com sucesso.' }); }
  catch { res.status(500).json({ message: 'Erro ao remover os dados.' }); }
};
exports.dropOneData = async (req, res) => {
  try { const deletedData = await incidents.remove(req.params.id); res.json({ message: 'Documento removido com sucesso.', deletedData }); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Erro ao remover o documento.' }); }
};

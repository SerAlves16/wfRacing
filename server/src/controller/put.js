const incidents = require('../services/incidentService');
exports.putData = async (req, res) => {
  try { res.json(await incidents.update(req.params.id, req.body)); }
  catch (error) { res.status(error.status || (error.name === 'ValidationError' ? 400 : 500)).json({ message: error.status ? error.message : 'Erro ao atualizar dados.' }); }
};

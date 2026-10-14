const mongoose = require('mongoose');
const schemas = {
 incident: { corrida: 'number', camera: 'string', indice: 'number', curva: 'string', hora: 'string', video: 'boolean', report: 'boolean', nfa: 'nullableBoolean', priority: 'boolean', obs: 'string' },
 numpad: { numberButtons: 'number', numberCorrida: 'number' },
 observation: { descricao: 'text' }, race: { race: 'text' }
};
// Accept legacy numeric form strings, but reject arbitrary fields and MongoDB operators.
module.exports = type => (req, res, next) => {
  if (req.params.id && !mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object' || !Object.keys(req.body).length) return res.status(400).json({ message: 'Empty or invalid body' });
  const result = {};
  for (const [field, value] of Object.entries(req.body)) {
    const kind = schemas[type][field];
    if (!kind) return res.status(400).json({ message: 'Unknown field: ' + field });
    if (kind === 'number') {
      if (!(typeof value === 'number' || typeof value === 'string' && value.trim() !== '') || !Number.isSafeInteger(Number(value)) || Number(value) < (field === 'indice' ? 0 : 1) || field === 'numberButtons' && Number(value) > 500) return res.status(400).json({ message: 'Invalid number: ' + field });
      result[field] = Number(value);
    } else if (kind === 'boolean' || kind === 'nullableBoolean') {
      if (typeof value !== 'boolean' && !(kind === 'nullableBoolean' && value === null)) return res.status(400).json({ message: 'Invalid boolean: ' + field });
      result[field] = value;
    } else {
      if (typeof value !== 'string' || value.length > 10000 || kind === 'text' && !value.trim()) return res.status(400).json({ message: 'Invalid text: ' + field });
      result[field] = value;
    }
  }
  // Manual typing must not bypass race-state validation through casing or surrounding spaces.
  if (type === 'incident' && typeof result.curva === 'string') {
    const flags = { start: 'Start', 'red flag': 'Red Flag', 'slow flag': 'Slow Flag' };
    result.curva = flags[result.curva.trim().toLowerCase()] || result.curva;
  }
  req.body = result;
  next();
};


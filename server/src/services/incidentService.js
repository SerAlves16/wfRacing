const Dados = require('../models/schema');
const raceEvents = ['Start', 'Red Flag'];
const conflict = message => Object.assign(new Error(message), { status: 409 });
const notFound = () => Object.assign(new Error('Incidente não encontrado.'), { status: 404 });

// Serialize mutations in this Node server so simultaneous users cannot consume one Red Flag twice.
let mutationQueue = Promise.resolve();
function mutate(action) {
  const result = mutationQueue.then(action);
  mutationQueue = result.catch(() => {});
  return result;
}
exports.withMutation = mutate;

function invalidStarts(events, corrida) {
  let started = false;
  let stopped = false;
  let invalid = 0;
  // Table position and editable clock values never change event creation chronology.
  for (const event of events.filter(item => item.corrida === corrida).sort((a,b) => String(a._id).localeCompare(String(b._id)))) {
    if (event.curva === 'Red Flag') stopped = true;
    if (event.curva === 'Start') {
      if (started && !stopped) invalid++;
      started = true;
      stopped = false;
    }
  }
  return invalid;
}

function validateChange(before, after) {
  const races = new Set([...before, ...after].map(event => event.corrida));
  for (const corrida of races) {
    // Existing historical errors remain readable; new changes cannot add an invalid restart.
    if (invalidStarts(after, corrida) > invalidStarts(before, corrida)) {
      throw conflict(`A corrida ${corrida} já foi iniciada. É necessária uma Red Flag após o último Start para permitir um novo Start.`);
    }
  }
}

async function history(races) {
  return Dados.find({ corrida: { $in: races }, curva: { $in: raceEvents } }).lean();
}

exports.create = body => mutate(async () => {
  const document = new Dados(body);
  if (raceEvents.includes(document.curva)) {
    if (!Number.isSafeInteger(document.corrida) || document.corrida < 1) throw Object.assign(new Error('Número de corrida inválido.'), { status: 400 });
    const before = await history([document.corrida]);
    validateChange(before, [...before, document.toObject()]);
  }
  const last = await Dados.findOne({ indice: { $exists: true } }).sort({ indice: -1 });
  document.indice = last ? last.indice + 1 : await Dados.countDocuments();
  return document.save();
});

exports.update = (id, updates) => mutate(async () => {
  const existing = await Dados.findById(id);
  if (!existing) throw notFound();
  const afterDocument = { ...existing.toObject(), ...updates };
  const eventChanged = existing.curva !== afterDocument.curva || existing.corrida !== afterDocument.corrida;
  if (eventChanged && (raceEvents.includes(existing.curva) || raceEvents.includes(afterDocument.curva))) {
    const before = await history([existing.corrida, afterDocument.corrida]);
    const after = before.filter(event => String(event._id) !== String(existing._id));
    if (raceEvents.includes(afterDocument.curva)) after.push(afterDocument);
    validateChange(before, after);
  }
  existing.set(updates);
  return existing.save();
});

exports.remove = id => mutate(async () => {
  const existing = await Dados.findById(id);
  if (!existing) throw notFound();
  if (raceEvents.includes(existing.curva)) {
    const before = await history([existing.corrida]);
    validateChange(before, before.filter(event => String(event._id) !== String(existing._id)));
  }
  await existing.deleteOne();
  return existing;
});

// Explicit admin-only clearing removes the entire history, allowing a fresh initial Start.
exports.clear = () => mutate(() => Dados.deleteMany({}));

const Race = require('../models/raceSchema');
const Settings = require('../models/numpadSchema');
const Incident = require('../models/schema');
const { withMutation } = require('./incidentService');

exports.createNext = expectedCurrentRace => withMutation(async () => {
  await Race.init();
  const current = await Settings.findOne().sort({ _id: -1 });
  const currentNumber = current?.numberCorrida || 1;
  if (expectedCurrentRace !== currentNumber) {
    throw Object.assign(new Error('A corrida atual mudou. Atualize os dados antes de criar outra corrida.'), { status: 409 });
  }
  const [latestIncident, latestSession, event] = await Promise.all([
    Incident.findOne({ corrida: { $gt: 0 } }).sort({ corrida: -1 }),
    Race.findOne({ number: { $exists: true } }).sort({ number: -1 }),
    Race.findOne().sort({ _id: -1 })
  ]);
  // Never reuse a number from an existing race, even if an older race is currently selected.
  const number = Math.max(currentNumber, latestIncident?.corrida || 0, latestSession?.number || 0) + 1;
  if (!Number.isSafeInteger(number)) throw Object.assign(new Error('Número de corrida inválido.'), { status: 400 });
  let session;
  try {
    session = await Race.create({ number, race: event?.race || 'WFR RaceTech', createdAt: new Date() });
    if (current) {
      const updated = await Settings.findOneAndUpdate({ _id: current._id, numberCorrida: current.numberCorrida }, { $set: { numberCorrida: number } }, { new: true, runValidators: true });
      if (!updated) throw Object.assign(new Error('A corrida atual mudou. Tente novamente.'), { status: 409 });
    } else {
      await Settings.create({ numberCorrida: number, numberButtons: 12 });
    }
    return session;
  } catch (error) {
    // A failed switch must not leave a newly allocated empty session behind.
    if (session) await Race.deleteOne({ _id: session._id });
    if (error.code === 11000) throw Object.assign(new Error('Outra operação já criou esta corrida. Atualize os dados.'), { status: 409 });
    throw error;
  }
});

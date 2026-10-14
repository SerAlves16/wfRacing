const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema({
  race: {
    type: String,
  },
  // Legacy name-only documents remain valid. Only explicitly created sessions have a number.
  number: { type: Number, min: 1, unique: true, sparse: true },
  createdAt: { type: Date },
});

const Race = mongoose.model("race", raceSchema);

module.exports = Race;

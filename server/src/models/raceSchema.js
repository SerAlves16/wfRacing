const mongoose = require("mongoose");

const raceSchema = new mongoose.Schema({
  race: {
    type: String,
  },
});

const Race = mongoose.model("race", raceSchema);

module.exports = Race;

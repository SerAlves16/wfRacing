const mongoose = require("mongoose");

// Definir modelo Mongoose para os dados
const obsOptionsSchema = new mongoose.Schema({
  descricao:{
    type: String,
  },
});

const obsOptions = mongoose.model("obsoptions", obsOptionsSchema, "obsOptions");

module.exports = obsOptions;

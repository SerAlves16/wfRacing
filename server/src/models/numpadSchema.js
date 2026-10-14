const mongoose = require("mongoose");

// Definir modelo Mongoose para os dados
const dadoNumpadSchema = new mongoose.Schema({
  numberButtons:{
    type: Number,
  },
  numberCorrida:{
    type: Number,
  }
});

const DadosNumpad = mongoose.model("numpad", dadoNumpadSchema, "numpadNumbers");

module.exports = DadosNumpad;

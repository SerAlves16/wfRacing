const mongoose = require("mongoose");
const DadosNumpad = require("../models/numpadSchema");

exports.dropDataNumpad = async (req, res) => {
  try {
    // Excluir todos os documentos da coleção
    await DadosNumpad.deleteMany({});
    res.json({ message: "Numero eliminado com sucesso." });
  } catch (error) {
    console.error("Erro ao remover os dados:", error);
    res.status(500).json({ error: "Erro ao remover os dados." });
  }
};

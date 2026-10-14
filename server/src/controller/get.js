const Dados = require("../models/schema");

// Rota para buscar todos os dados do banco de dados
exports.getData = async (req, res) => {
  try {
    // Buscar todos os dados no banco de dados
    const dados = await Dados.find().sort({ indice: 1, _id: 1 });
    // Retornar os dados encontrados como resposta
    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados." });
  }
};


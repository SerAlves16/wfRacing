const obsOptions = require("../../models/obsOptionsSchema");

// Rota para buscar todos os dados do banco de dados
exports.getObsOptions = async (req, res) => {
  try {
    // Buscar todos os dados no banco de dados
    const dados = await obsOptions.find();
    // Retornar os dados encontrados como resposta
    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res.status(500).json({ error: "Erro ao buscar dados." });
  }
};

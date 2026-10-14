const mongoose = require("mongoose");
const Dados = require("../models/schema");

exports.dropData = async (req, res) => {
  try {
    // Excluir todos os documentos da coleção
    await Dados.deleteMany({});
    res.json({ message: "Todos os dados foram removidos com sucesso." });
  } catch (error) {
    console.error("Erro ao remover os dados:", error);
    res.status(500).json({ error: "Erro ao remover os dados." });
  }
};

exports.dropOneData = async (req, res) => {
  try {
    const { id } = req.params; // Supondo que o ID do documento a ser excluído seja passado nos parâmetros da solicitação

    // Excluir o documento com base no ID
    const deletedData = await Dados.findByIdAndDelete(id);

    if (!deletedData) {
      return res
        .status(404)
        .json({ error: "Nenhum documento encontrado com o ID fornecido." });
    }

    res.json({ message: "Documento removido com sucesso.", deletedData });
  } catch (error) {
    console.error("Erro ao remover o documento:", error);
    res.status(500).json({ error: "Erro ao remover o documento." });
  }
};

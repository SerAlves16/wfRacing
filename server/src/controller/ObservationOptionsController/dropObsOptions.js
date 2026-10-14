const mongoose = require("mongoose");
const obsOptions = require("../../models/schema");

exports.dropObsOptions = async (req, res) => {
  try {
    // Excluir todos os documentos da coleção
    await obsOptions.deleteMany({});
    res.json({ message: "Todos os obsOptions foram removidos com sucesso." });
  } catch (error) {
    console.error("Erro ao remover os obsOptions:", error);
    res.status(500).json({ error: "Erro ao remover os obsOptions." });
  }
};

exports.dropOneObsOption = async (req, res) => {
  try {
    const { id } = req.params; // Supondo que o ID do documento a ser excluído seja passado nos parâmetros da solicitação

    // Excluir o documento com base no ID
    const deletedData = await obsOptions.findByIdAndDelete(id);

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

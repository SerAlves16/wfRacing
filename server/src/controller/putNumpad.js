const DadosNumpad = require("../models/numpadSchema");

// Função para atualizar os dados pelo ID
exports.putNumpadData = async (req, res) => {
  const updates = req.body;

  try {
    // Encontra o documento pelo ID e atualiza os campos fornecidos
    const updatedData = await DadosNumpad.findByIdAndUpdate(
      req.params.id, // ID do documento a ser atualizado
      updates, // Campos a serem atualizados
      { new: true, runValidators: true } // Opção para retornar o documento atualizado
    );

    // Verifica se o documento foi encontrado e atualizado
    if (!updatedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    // Responde com os dados atualizados
    res.status(200).json(updatedData);
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    res.status(500).json({ error: "Erro interno do servidor ao atualizar dados." });
  }
};

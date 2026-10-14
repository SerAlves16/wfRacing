const obsOptions = require("../../models/obsOptionsSchema");

exports.addObsOptions = async (req, res) => {
  try {
    const { descricao } = req.body;

    // Criar um novo objeto de dados com os dados recebidos
    const novoDado = new obsOptions({
      descricao,
    });
    console.log(novoDado);
    // Salvar o novo dado no banco de dados
    await novoDado.save();

    res.json({ message: "Dados adicionados com sucesso." });
  } catch (error) {
    console.error("Erro ao adicionar dados:", error);
    res.status(500).json({ error: "Erro ao adicionar dados." });
  }
};

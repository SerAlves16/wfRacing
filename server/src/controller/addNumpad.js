const DadosNumpad = require("../models/numpadSchema");

exports.addDataNumpad = async (req, res) => {
  try {
    const { numberButtons, numberCorrida } = req.body;

    // Criar um novo objeto de dados com os dados recebidos
    const novoDado = new DadosNumpad({
      numberButtons,
      numberCorrida
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

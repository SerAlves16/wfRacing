const express = require("express");
const router = express.Router();
const auth = require('../middleware/authenticateToken');
const role = require('../middleware/requireRole');
const validate = require('../middleware/validateBody');
router.use(auth);
const validateId = (req, res, next) => require('mongoose').isObjectIdOrHexString(req.params.id) ? next() : res.status(400).json({ message: 'Invalid ID' });
const {
  addController,
  getController,
  dropController,
  putController,
  addNumpadController,
  dropNumpadController,
  getNumpadController,
  addRaceController,
  getRaceController,
  putNumpadController,
  addObsOptionsController,
  getObsOptionsController,
  dropObsOptionsController,
  putObsOptionsController,
} = require("../controller/indexcont");

//CRUD
// Rota para adicionar dados ao banco de dados
router.post("/addData", role('admin', 'operator', 'user'), validate('incident'), addController.addData);

// Rota para buscar todos os dados do banco de dados
router.get("/getData", getController.getData);

// Rota para apagar todos os dados do banco de dados
router.post("/dropData", role('admin'), dropController.dropData);

// Rota para apagar um único documento
router.delete("/dropData/:id", validateId, role('admin', 'operator', 'user'), dropController.dropOneData);

// Rota para atualizar todos os dados do banco de dados
router.post("/updateData/:id", role('admin', 'operator', 'user'), validate('incident'), putController.putData);

// Rota para dicionar um numero ao numpad
router.post("/addDataNumpad", role('admin', 'operator'), validate('numpad'), addNumpadController.addDataNumpad);

// Rota para remover numero do numpad
router.post("/dropDataNumpad", role('admin'), dropNumpadController.dropDataNumpad);

// Rota para consultar numero do numpad
router.get("/getDataNumpad", getNumpadController.getDataNumpad);

// Rota para atualizar dados do numpad
router.post("/updateNumpad/:id", role('admin', 'operator'), validate('numpad'), putNumpadController.putNumpadData);

// Rota para adicionar opções ás observações
router.post("/addObsOptions", role('admin', 'operator'), validate('observation'), addObsOptionsController.addObsOptions);

// Rota para buscar todas as opcoes a base de dados
router.get("/getObsOptions", getObsOptionsController.getObsOptions);

// Rota para apagar todas as opções na base de dados
router.post("/dropObsOptions", role('admin'), dropObsOptionsController.dropObsOptions);

// Rota para apagar uma única opção
router.delete("/dropObsOptions/:id", validateId, role('admin', 'operator'), dropObsOptionsController.dropOneObsOption);

// Rota para atualizar uma oção
router.post("/updateObsOptions/:id", role('admin', 'operator'), validate('observation'), putObsOptionsController.putObsOptions);

// Rota para adicionar RACE
router.post("/addRace", role('admin', 'operator'), validate('race'), addRaceController.addRace);

// Rota para consultar Last RACE
router.get("/getLRace", getRaceController.getLastRaceId);

router.put('/updateData/:id', role('admin', 'operator', 'user'), validate('incident'), putController.putData);
router.post('/reorderData', role('admin', 'operator', 'user'), require('../controller/reorder').reorder);
module.exports = router;



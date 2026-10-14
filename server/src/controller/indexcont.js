const addController = require("./add");
const getController = require("./get");
const dropController = require("./drop");
const putController = require("./put");
const addNumpadController = require("./addNumpad");
const dropNumpadController = require("./dropNumpad");
const getNumpadController = require("./getNumpad");
const putNumpadController = require("./putNumpad");
const addObsOptionsController = require("./ObservationOptionsController/addObsOptions");
const dropObsOptionsController = require("./ObservationOptionsController/dropObsOptions");
const getObsOptionsController = require("./ObservationOptionsController/getObsOptions");
const putObsOptionsController = require("./ObservationOptionsController/putObsOptions");
const addRaceController = require("./addRace");
const getRaceController = require("./getRace");

module.exports = {
  addController,
  getController,
  dropController,
  putController,
  addNumpadController,
  dropNumpadController,
  getNumpadController,
  putNumpadController,
  addRaceController,
  getRaceController,
  addObsOptionsController,
  dropObsOptionsController,
  getObsOptionsController,
  putObsOptionsController,
};

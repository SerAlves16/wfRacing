// Isolated browser verification fixture. Never connects to the project's database.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
process.env.JWT_SECRET = require('node:crypto').randomBytes(48).toString('hex');
const { app } = require('../server');
const User = require('../server/src/models/models');
const Incident = require('../server/src/models/schema');
const Settings = require('../server/src/models/numpadSchema');
const Race = require('../server/src/models/raceSchema');
const Observation = require('../server/src/models/obsOptionsSchema');
async function main(){
 const database=await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });await mongoose.connect(database.getUri());
 for(const usertype of ['admin','operator','user'])await User.create({username:usertype,password:await bcrypt.hash('testing-password',10),usertype});
 await Settings.create({numberButtons:12,numberCorrida:1});await Race.create({race:'WFR - Teste de conversao'});await Observation.create({descricao:'Contact between karts'});
 await Incident.create({corrida:1,camera:'2',curva:'Turn 3',hora:'12:01:00',obs:'Contacto em pista',report:true,indice:0});
 const server=app.listen(3100,'127.0.0.1',()=>console.log('Isolated verification: http://127.0.0.1:3100'));
 const stop=async()=>{await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();await database.stop();process.exit(0)};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
main().catch(error=>{console.error(error.message);process.exitCode=1});

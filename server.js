// Compatibility entry point for node server.js.
const { app, start } = require('./server/src/app');
if (require.main === module) start().catch(error => { console.error('Unable to start:', error.message); process.exitCode = 1; });
module.exports = { app, start };

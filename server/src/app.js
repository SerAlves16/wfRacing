const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config/env');
const app = express();
app.disable('x-powered-by');
const origins = (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) { callback(null, !origin || origins.includes(origin)); } }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ database: mongoose.connection.readyState === 1 ? 'connected' : 'unavailable' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));
for (const route of ['/admin.html', '/cliente.html', '/index.html']) app.get(route, (req, res) => res.redirect('/'));
// Serve only the compiled React app. Backend files and legacy sources remain private.
const clientBuild = path.resolve(__dirname, '../..', 'client/dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
 if (req.path !== '/') return res.status(404).json({ message: 'File not found' });
 if (!fs.existsSync(path.join(clientBuild, 'index.html'))) return res.status(503).json({ message: 'Run npm run build, or use npm run dev on port 5173' });
 res.sendFile(path.join(clientBuild, 'index.html'));
});
app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.status === 400 ? 'Invalid JSON' : 'Internal server error' }));
async function start() {
 await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
 return app.listen(config.port, () => console.log('WFR: http://localhost:' + config.port));
}
module.exports = { app, start };
